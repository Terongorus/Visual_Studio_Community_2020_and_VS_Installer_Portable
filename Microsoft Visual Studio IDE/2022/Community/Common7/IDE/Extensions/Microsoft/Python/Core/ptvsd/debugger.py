# Python Tools for Visual Studio
# Copyright(c) Microsoft Corporation
# All rights reserved.
# 
# Licensed under the Apache License, Version 2.0 (the License); you may not use
# this file except in compliance with the License. You may obtain a copy of the
# License at http://www.apache.org/licenses/LICENSE-2.0
# 
# THIS CODE IS PROVIDED ON AN  *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS
# OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
# IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
# MERCHANTABILITY OR NON-INFRINGEMENT.
# 
# See the Apache Version 2.0 License for specific language governing
# permissions and limitations under the License.

from __future__ import with_statement, print_function

__author__ = "Microsoft Corporation <ptvshelp@microsoft.com>"
__version__ = "3.2.1.0"

# This module MUST NOT import threading in global scope. This is because in a direct (non-ptvsd)
# attach scenario, it is loaded on the injected debugger attach thread, and if threading module
# hasn't been loaded already, it will assume that the thread on which it is being loaded is the
# main thread. This will cause issues when the thread goes away after attach completes.
_threading = None

import sys
import ctypes
try:
    import thread
except ImportError:
    import _thread as thread
import socket
import struct
import weakref
import traceback
import types
import bisect
from os import path
import ntpath
import runpy
import datetime
import itertools
from codecs import BOM_UTF8

import ptvsd
import ptvsd.util as _vspu
import ptvsd.ipcjson as _vsipc
import ptvsd.repl as _vspr

to_bytes = _vspu.to_bytes
exec_file = _vspu.exec_file
exec_module = _vspu.exec_module
exec_code = _vspu.exec_code
safe_repr = _vspu.SafeRepr()

try:
    import stackless
except ImportError:
    stackless = None

try:
    xrange
except:
    xrange = range

if sys.platform == 'cli':
    import clr
    from System.Runtime.CompilerServices import ConditionalWeakTable
    IPY_SEEN_MODULES = ConditionalWeakTable[object, object]()

    clr.AddReference('Microsoft.Dynamic')
    clr.AddReference('Microsoft.Scripting')
    clr.AddReference('IronPython')
    from Microsoft.Scripting import KeyboardInterruptException
    from Microsoft.Scripting import ParamDictionaryAttribute
    from IronPython.Runtime.Operations import PythonOps
    from IronPython.Runtime import PythonContext
    from Microsoft.Scripting import SourceUnit, SourceCodeKind
    from Microsoft.Scripting.Runtime import Scope

    python_context = clr.GetCurrentRuntime().GetLanguage(PythonContext)

    from System import DBNull, ParamArrayAttribute
    builtin_method_descriptor_type = type(list.append)

    import System
    NamespaceType = type(System)


# Import encodings early to avoid import on the debugger thread, which may cause deadlock
from encodings import utf_8

# WARNING: Avoid imports beyond this point, specifically on the debugger thread, as this may cause
# deadlock where the debugger thread performs an import while a user thread has the import lock

# save start_new_thread so we can call it later, we'll intercept others calls to it.

debugger_dll_handle = None

# Called by PyDebugAttach
def set_debugger_dll_handle(handle):
    global debugger_dll_handle
    debugger_dll_handle = handle


DETACHED = True
def thread_creator(func, args, kwargs = {}, *extra_args):
    if not isinstance(args, tuple):
        # args is not a tuple. This may be because we have become bound to a
        # class, which has offset our arguments by one.
        if isinstance(kwargs, tuple):
            func, args = args, kwargs
            kwargs = extra_args[0] if len(extra_args) > 0 else {}

    return _start_new_thread(new_thread_wrapper, (func, args, kwargs))

_thread_start_new_thread = thread.start_new_thread
def _start_new_thread(func, args, kwargs = {}):
    t_lock = thread.allocate_lock()
    t_lock.acquire()
    
    tid = []
    def thread_starter(a, kw):
        tid.append(thread.get_ident())
        t_lock.release()
        return func(*a, **kw)
    
    _thread_start_new_thread(thread_starter, (args, kwargs))
    with t_lock:
        return tid[0]

THREADS = {}
THREADS_LOCK = thread.allocate_lock()
MODULES = []

BREAK_ON_SYSTEMEXIT_ZERO = False
DEBUG_STDLIB = False
DJANGO_DEBUG = False

# Py3k compat - alias unicode to str
try:
    unicode
except:
    unicode = str

# A value of a synthesized child. The string is passed through to the variable list, and type is not displayed at all.
class SynthesizedValue(object):
    def __init__(self, repr_value='', len_value=None):
        self.repr_value = repr_value
        self.len_value = len_value
    def __repr__(self):
        return self.repr_value
    def __len__(self):
        return self.len_value

IMPORTLIB_BOOTSTRAP = []
if sys.version_info >= (3, 3):
    IMPORTLIB_BOOTSTRAP.append(path.normcase('<frozen importlib._bootstrap>'))
if sys.version_info >= (3, 5):
    IMPORTLIB_BOOTSTRAP.append(path.normcase('<frozen importlib._bootstrap_external>'))

# Specifies list of files not to debug. Can be extended by other modules
# (the REPL does this for $attach support and not stepping into the REPL).
DONT_DEBUG = IMPORTLIB_BOOTSTRAP + [
    path.normcase(__file__),
    path.normcase(ptvsd.__file__),
    path.normcase(_vspu.__file__),
    path.normcase(_vspr.__file__),
    path.normcase(_vsipc.__file__),
]


# Contains information about all breakpoints in the process. Keys are line numbers on which
# there are breakpoints in any file, and values are dicts. For every line number, the
# corresponding dict contains all the breakpoints that fall on that line. The keys in that
# dict are tuples of the form (filename, breakpoint_id), each entry representing a single
# breakpoint, and values are BreakpointInfo objects.
#
# For example, given the following breakpoints:
#
#   1. In 'main.py' at line 10.
#   2. In 'main.py' at line 20.
#   3. In 'module.py' at line 10.
#
# the contents of BREAKPOINTS would be:
# {10: {('main.py', 1): ..., ('module.py', 3): ...}, 20: {('main.py', 2): ... }}
BREAKPOINTS = {}

# Contains information about all pending (i.e. not yet bound) breakpoints in the process.
# Elements are BreakpointInfo objects.
PENDING_BREAKPOINTS = set()

# Must be in sync with enum BreakpointConditionKind in LegacyDebuggerProtocol.cs
BREAKPOINT_CONDITION_ALWAYS = 0
BREAKPOINT_CONDITION_WHEN_TRUE = 1
BREAKPOINT_CONDITION_WHEN_CHANGED = 2

# Must be in sync with enum BreakpointPassCountKind in LegacyDebuggerProtocol.cs
BREAKPOINT_PASS_COUNT_ALWAYS = 0
BREAKPOINT_PASS_COUNT_EVERY = 1
BREAKPOINT_PASS_COUNT_WHEN_EQUAL = 2
BREAKPOINT_PASS_COUNT_WHEN_EQUAL_OR_GREATER = 3

# Must be in sync with enum LanguageKind in LegacyDebuggerProtocol.cs
LANGUAGE_PYTHON = 0
LANGUAGE_DJANGO = 1

class BreakpointInfo(object):
    __slots__ = [
        'breakpoint_id', 'filename', 'lineno', 'condition_kind', 'condition',
        'pass_count_kind', 'pass_count', 'is_bound', 'last_condition_value',
        'hit_count'
    ]

    # For "when changed" breakpoints, this is used as the initial value of last_condition_value,
    # such that it is guaranteed to not compare equal to any other value that it will get later.
    _DUMMY_LAST_VALUE = object()

    def __init__(self, breakpoint_id, filename, lineno, condition_kind, condition, pass_count_kind, pass_count):
        self.breakpoint_id = breakpoint_id
        self.filename = filename
        self.lineno = lineno
        self.condition_kind = condition_kind
        self.condition = condition
        self.pass_count_kind = pass_count_kind
        self.pass_count = pass_count
        self.is_bound = False
        self.last_condition_value = BreakpointInfo._DUMMY_LAST_VALUE
        self.hit_count = 0

    @staticmethod
    def find_by_id(breakpoint_id):
        for line, bp_dict in BREAKPOINTS.items():
            for (filename, bp_id), bp in bp_dict.items():
                if bp_id == breakpoint_id:
                    return bp
        return None

# lock for calling .send on the socket
send_lock = thread.allocate_lock()

class _SendLockContextManager(object):
    """context manager for send lock.  Handles both acquiring/releasing the 
       send lock as well as detaching the debugger if the remote process 
       is disconnected"""

    def __enter__(self):
        # mark that we're about to do socket I/O so we won't deliver
        # debug events when we're debugging the standard library
        cur_thread = get_thread_from_id(thread.get_ident())
        if cur_thread is not None:
            cur_thread.is_sending = True

        send_lock.acquire()

    def __exit__(self, exc_type, exc_value, tb):
        send_lock.release()
        
        # start sending debug events again
        cur_thread = get_thread_from_id(thread.get_ident())
        if cur_thread is not None:
            cur_thread.is_sending = False

        if exc_type is not None:
            detach_threads()
            detach_process()
            # swallow the exception, we're no longer debugging
            return True 
       
_SendLockCtx = _SendLockContextManager()

SEND_BREAK_COMPLETE = False

STEPPING_OUT = -1  # first value, we decrement below this
STEPPING_NONE = 0
STEPPING_BREAK = 1
STEPPING_LAUNCH_BREAK = 2
STEPPING_ATTACH_BREAK = 3
STEPPING_INTO = 4
STEPPING_OVER = 5     # last value, we increment past this.

USER_STEPPING = (STEPPING_OUT, STEPPING_INTO, STEPPING_OVER)

FRAME_KIND_NONE = 0
FRAME_KIND_PYTHON = 1
FRAME_KIND_DJANGO = 2

DJANGO_BUILTINS = {'True': True, 'False': False, 'None': None}

PYTHON_EVALUATION_RESULT_REPR_KIND_NORMAL = 0    # regular repr and hex repr (if applicable) for the evaluation result; length is len(result)
PYTHON_EVALUATION_RESULT_REPR_KIND_RAW = 1       # repr is raw representation of the value - see TYPES_WITH_RAW_REPR; length is len(repr)
PYTHON_EVALUATION_RESULT_REPR_KIND_RAWLEN = 2    # same as above, but only the length is reported, not the actual value

PYTHON_EVALUATION_RESULT_EXPANDABLE = 1
PYTHON_EVALUATION_RESULT_METHOD_CALL = 2
PYTHON_EVALUATION_RESULT_SIDE_EFFECTS = 4
PYTHON_EVALUATION_RESULT_RAW = 8
PYTHON_EVALUATION_RESULT_HAS_RAW_REPR = 16

# Don't show attributes of these types if they come from the class (assume they are methods).
METHOD_TYPES = (
    types.FunctionType,
    types.MethodType,
    types.BuiltinFunctionType,
    type("".__repr__), # method-wrapper
)

# repr() for these types can be used as input for eval() to get the original value.
# float is intentionally not included because it is not always round-trippable (e.g inf, nan).
TYPES_WITH_ROUND_TRIPPING_REPR = set((type(None), int, bool, str, unicode))
if sys.version[0] == '3':
    TYPES_WITH_ROUND_TRIPPING_REPR.add(bytes)
else:
    TYPES_WITH_ROUND_TRIPPING_REPR.add(long)

# repr() for these types can be used as input for eval() to get the original value, provided that the same is true for all their elements.
COLLECTION_TYPES_WITH_ROUND_TRIPPING_REPR = set((tuple, list, set, frozenset))

# eval(repr(x)), but optimized for common types for which it is known that result == x.
def eval_repr(x):
    def is_repr_round_tripping(x):
        # Do exact type checks here - subclasses can override __repr__.
        if type(x) in TYPES_WITH_ROUND_TRIPPING_REPR:
            return True
        elif type(x) in COLLECTION_TYPES_WITH_ROUND_TRIPPING_REPR:
            # All standard sequence types are round-trippable if their elements are.
            return all((is_repr_round_tripping(item) for item in x))
        else:
            return False
    if is_repr_round_tripping(x):
        return x
    else:
        return eval(repr(x), {})

# key is type, value is function producing the raw repr
TYPES_WITH_RAW_REPR = {
    unicode: (lambda s: s)
}

# bytearray is 2.6+
try:
    # getfilesystemencoding is used here because it effectively corresponds to the notion of "locale encoding":
    # current ANSI codepage on Windows, LC_CTYPE on Linux, UTF-8 on OS X - which is exactly what we want.
    TYPES_WITH_RAW_REPR[bytearray] = lambda b: b.decode(sys.getfilesystemencoding(), 'ignore') 
except:
    pass

if sys.version[0] == '3':
    TYPES_WITH_RAW_REPR[bytes] = TYPES_WITH_RAW_REPR[bytearray]
else:
    TYPES_WITH_RAW_REPR[str] = TYPES_WITH_RAW_REPR[unicode]

if sys.version[0] == '3':
  # work around a crashing bug on CPython 3.x where they take a hard stack overflow
  # we'll never see this exception but it'll allow us to keep our try/except handler
  # the same across all versions of Python
    class StackOverflowException(Exception): pass
else:
    StackOverflowException = RuntimeError
  
def get_thread_from_id(id):
    THREADS_LOCK.acquire()
    try:
        return THREADS.get(id)
    finally:
        THREADS_LOCK.release()

def should_send_frame(frame):
    return (frame is not None and
            frame.f_code not in DEBUG_ENTRYPOINTS and
            not is_dont_debug(path.normcase(frame.f_code.co_filename)))

KNOWN_DIRECTORIES = set((None, ''))
KNOWN_ZIPS = set()

def is_file_in_zip(filename):
    parent, name = path.split(path.abspath(filename))
    if parent in KNOWN_DIRECTORIES:
        return False
    elif parent in KNOWN_ZIPS:
        return True
    elif path.isfile(parent):
        KNOWN_ZIPS.add(parent) 
        return True     
    elif path.isdir(parent):    
        KNOWN_DIRECTORIES.add(parent)
        return False
    else:
        return is_file_in_zip(parent)

def lookup_builtin(name, frame):
    try:
        return frame.f_builtins.get(bits)
    except:
        # http://ironpython.codeplex.com/workitem/30908
        builtins = frame.f_globals['__builtins__']
        if not isinstance(builtins, dict):
            builtins = builtins.__dict__
        return builtins.get(name)

def lookup_local(frame, name):
    bits = name.split('.')
    obj = frame.f_locals.get(bits[0]) or frame.f_globals.get(bits[0]) or lookup_builtin(bits[0], frame)
    bits.pop(0)
    while bits and obj is not None and type(obj) is types.ModuleType:
        obj = getattr(obj, bits.pop(0), None)
    return obj
        
if sys.version_info[0] >= 3:
    _EXCEPTIONS_MODULE = 'builtins'
else:
    _EXCEPTIONS_MODULE = 'exceptions'

def get_exception_name(exc_type):
    if exc_type.__module__ == _EXCEPTIONS_MODULE:
        return exc_type.__name__
    else:
        return exc_type.__module__ + '.' + exc_type.__name__

# These constants come from Visual Studio - enum_EXCEPTION_STATE
BREAK_MODE_NEVER = 0
BREAK_MODE_ALWAYS = 1
BREAK_MODE_UNHANDLED = 32

BREAK_TYPE_NONE = 0
BREAK_TYPE_UNHANDLED = 1
BREAK_TYPE_HANDLED = 2

class ExceptionBreakInfo(object):
    BUILT_IN_HANDLERS = {
        path.normcase('<frozen importlib._bootstrap>'): ((None, None, '*'),),
        path.normcase('build\\bdist.win32\\egg\\pkg_resources.py'): ((None, None, '*'),),
        path.normcase('build\\bdist.win-amd64\\egg\\pkg_resources.py'): ((None, None, '*'),),
    }

    def __init__(self):
        self.default_mode = BREAK_MODE_UNHANDLED
        self.break_on = { }
        self.handler_cache = dict(self.BUILT_IN_HANDLERS)
        self.handler_lock = thread.allocate_lock()
        self.add_exception('exceptions.IndexError', BREAK_MODE_NEVER)
        self.add_exception('builtins.IndexError', BREAK_MODE_NEVER)
        self.add_exception('exceptions.KeyError', BREAK_MODE_NEVER)
        self.add_exception('builtins.KeyError', BREAK_MODE_NEVER)
        self.add_exception('exceptions.AttributeError', BREAK_MODE_NEVER)
        self.add_exception('builtins.AttributeError', BREAK_MODE_NEVER)
        self.add_exception('exceptions.StopIteration', BREAK_MODE_NEVER)
        self.add_exception('builtins.StopIteration', BREAK_MODE_NEVER)
        self.add_exception('exceptions.GeneratorExit', BREAK_MODE_NEVER)
        self.add_exception('builtins.GeneratorExit', BREAK_MODE_NEVER)

    def clear(self):
        self.default_mode = BREAK_MODE_UNHANDLED
        self.break_on.clear()
        self.handler_cache = dict(self.BUILT_IN_HANDLERS)

    def should_break(self, thread, ex_type, ex_value, trace):
        probe_stack()
        name = get_exception_name(ex_type)
        mode = self.break_on.get(name, self.default_mode)
        break_type = BREAK_TYPE_NONE
        if mode & BREAK_MODE_ALWAYS:
            if self.is_handled(thread, ex_type, ex_value, trace):
                break_type = BREAK_TYPE_HANDLED
            else:
                break_type = BREAK_TYPE_UNHANDLED
        elif (mode & BREAK_MODE_UNHANDLED) and not self.is_handled(thread, ex_type, ex_value, trace):
            break_type = BREAK_TYPE_UNHANDLED

        if break_type:
            if issubclass(ex_type, SystemExit):
                if not BREAK_ON_SYSTEMEXIT_ZERO:
                    if not ex_value or (isinstance(ex_value, SystemExit) and not ex_value.code):
                        break_type = BREAK_TYPE_NONE

        return break_type
    
    def is_handled(self, thread, ex_type, ex_value, trace):
        if trace is None:
            # get out if we didn't get a traceback
            return False

        if trace.tb_next is not None:
          if should_send_frame(trace.tb_next.tb_frame) and should_debug_code(trace.tb_next.tb_frame.f_code):
            # don't break if this is not the top of the traceback,
            # unless the previous frame was not debuggable
            return True
            
        cur_frame = trace.tb_frame
        
        while should_send_frame(cur_frame) and cur_frame.f_code is not None and cur_frame.f_code.co_filename is not None:
            filename = path.normcase(cur_frame.f_code.co_filename)
            if is_file_in_zip(filename):
                # File is in a zip, so assume it handles exceptions
                return True

            if not is_same_py_file(filename, __file__):
                handlers = self.handler_cache.get(filename)
            
                if handlers is None:
                    # req handlers for this file from the debug engine
                    self.handler_lock.acquire()

                    send_debug_event(
                        name='legacyRequestHandlers',
                        fileName=filename,
                    )

                    # wait for the handler data to be received
                    self.handler_lock.acquire()
                    self.handler_lock.release()

                    handlers = self.handler_cache.get(filename)

                if handlers is None:
                    # no code available, so assume unhandled
                    return False

                line = cur_frame.f_lineno
                for line_start, line_end, expressions in handlers:
                    if line_start is None or line_start <= line < line_end:
                        if '*' in expressions:
                            return True

                        for text in expressions:
                            try:
                                res = lookup_local(cur_frame, text)
                                if res is not None and issubclass(ex_type, res):
                                    return True
                            except:
                                pass

            cur_frame = cur_frame.f_back

        return False
    
    def add_exception(self, name, mode=BREAK_MODE_UNHANDLED):
        if name.startswith(_EXCEPTIONS_MODULE + '.'):
            name = name[len(_EXCEPTIONS_MODULE) + 1:]
        self.break_on[name] = mode

BREAK_ON = ExceptionBreakInfo()

def probe_stack(depth = 10):
  """helper to make sure we have enough stack space to proceed w/o corrupting 
     debugger state."""
  if depth == 0:
      return
  probe_stack(depth - 1)

PREFIXES = [path.normcase(sys.prefix)]
# If we're running in a virtual env, DEBUG_STDLIB should respect this too.
if hasattr(sys, 'base_prefix'):
    PREFIXES.append(path.normcase(sys.base_prefix))
if hasattr(sys, 'real_prefix'):
    PREFIXES.append(path.normcase(sys.real_prefix))

def is_stdlib(filename):
    if not DEBUG_STDLIB:
        if filename in IMPORTLIB_BOOTSTRAP:
            return True
        for prefix in PREFIXES:
            if prefix != '' and filename.startswith(prefix):
                return True

def is_dont_debug(filename):
    return any(is_same_py_file(filename, f) for f in DONT_DEBUG)

def should_debug_code(code):
    if not code or not code.co_filename:
        return False

    filename = path.normcase(code.co_filename)
    if is_stdlib(filename):
        return False

    if is_dont_debug(filename):
        return False

    if is_file_in_zip(filename):
        # file in inside an egg or zip, so we can't debug it
        return False

    return True

attach_lock = thread.allocate_lock()
attach_sent_break = False

local_path_to_vs_path = {}

def breakpoint_path_match(vs_path, local_path):
    vs_path_norm = path.normcase(vs_path)
    local_path_norm = path.normcase(local_path)
    if local_path_to_vs_path.get(local_path_norm) == vs_path_norm:
        return True
    
    # Walk the local filesystem from local_path up, matching agains win_path component by component,
    # and stop when we no longer see an __init__.py. This should give a reasonably close approximation
    # of matching the package name.
    while True:
        local_path, local_name = path.split(local_path)
        vs_path, vs_name = ntpath.split(vs_path)
        # Match the last component in the path. If one or both components are unavailable, then
        # we have reached the root on the corresponding path without successfully matching.
        if not local_name or not vs_name or path.normcase(local_name) != path.normcase(vs_name):
            return False
        # If we have an __init__.py, this module was inside the package, and we still need to match
        # thatpackage, so walk up one level and keep matching. Otherwise, we've walked as far as we
        # needed to, and matched all names on our way, so this is a match.
        if not path.exists(path.join(local_path, '__init__.py')):
            break
    
    local_path_to_vs_path[local_path_norm] = vs_path_norm
    return True

def update_all_thread_stacks(blocking_thread = None, check_is_blocked = True):
    THREADS_LOCK.acquire()
    try:
        all_threads = list(THREADS.values())
    finally:
        THREADS_LOCK.release()
    
    for cur_thread in all_threads:
        if cur_thread is blocking_thread:
            continue
            
        cur_thread._block_starting_lock.acquire()
        if not check_is_blocked or not cur_thread._is_blocked:
            # release the lock, we're going to run user code to evaluate the frames
            cur_thread._block_starting_lock.release()        
                            
            frames = cur_thread.get_frame_list()
    
            # re-acquire the lock and make sure we're still not blocked.  If so send
            # the frame list.
            cur_thread._block_starting_lock.acquire()
            if not check_is_blocked or not cur_thread._is_blocked:
                cur_thread.send_frame_list(frames)
    
        cur_thread._block_starting_lock.release()
        
DJANGO_BREAKPOINTS = {}

class DjangoBreakpointInfo(object):
    def __init__(self, filename):
        self._line_locations = None
        self.filename = filename
        self.breakpoints = {}
    
    def add_breakpoint(self, lineno, brkpt_id):
        self.breakpoints[lineno] = brkpt_id

    def remove_breakpoint(self, lineno):
        del self.breakpoints[lineno]
    
    @property
    def line_locations(self):
        if self._line_locations is None:
            # we need to calculate our line number offset information
            try:
                contents = open(self.filename, 'rb')
            except:
                # file not available, locked, etc...
                pass
            else:
                with contents:
                    line_info = []
                    file_len = 0
                    for line in contents:
                        line_len = len(line)
                        if not line_info and line.startswith(BOM_UTF8):
                            line_len -= len(BOM_UTF8) # Strip the BOM, Django seems to ignore this...
                        if line.endswith(to_bytes('\r\n')):
                            line_len -= 1 # Django normalizes newlines to \n
                        file_len += line_len
                        line_info.append(file_len)
                    contents.close()
                    self._line_locations = line_info

        return self._line_locations

    def get_line_range(self, start, end):
        line_locs = self.line_locations 
        if line_locs is not None:
            low_line = bisect.bisect_right(line_locs, start)
            hi_line = bisect.bisect_right(line_locs, end)

            return low_line, hi_line

        return (None, None)

    def should_break(self, start, end):
        low_line, hi_line = self.get_line_range(start, end)
        if low_line is not None and hi_line is not None:
            # low_line/hi_line is 0 based, self.breakpoints is 1 based
            for i in xrange(low_line+1, hi_line+2): 
                bkpt_id = self.breakpoints.get(i)
                if bkpt_id  is not None:
                    return True, bkpt_id 

        return False, 0

def get_django_frame_source(frame):
    if frame.f_code.co_name == 'render':
        self_obj = frame.f_locals.get('self', None)
        if self_obj is None:
            return None
        name = type(self_obj).__name__
        if name in ('Template', 'TextNode'):
            return None
        source_obj = getattr(self_obj, 'source', None)
        if source_obj and hasattr(source_obj, '__len__') and len(source_obj) == 2:
            return str(source_obj[0]), source_obj[1]

        token_obj = getattr(self_obj, 'token', None)
        if token_obj is None:
            return None
        template_obj = getattr(frame.f_locals.get('context', None), 'template', None)
        if template_obj is None:
            return None
        template_name = getattr(template_obj, 'origin', None)
        position = getattr(token_obj, 'position', None)
        if template_name and position:
            return str(template_name), position


    return None

class ModuleExitFrame(object):
    def __init__(self, real_frame):
        self.real_frame = real_frame
        self.f_lineno = real_frame.f_lineno + 1

    def __getattr__(self, name):
        return getattr(self.real_frame, name)

class Thread(object):
    def __init__(self, id = None):
        # Replace some methods with their bound versions, so that bound wrappers aren't recreated on every access.
        self.trace_func = self.trace_func
        self.handle_line = self.handle_line
        self.handle_call = self.handle_call
        self.push_frame = self.push_frame
        self.pop_frame = self.pop_frame
        self.should_block_on_frame = self.should_block_on_frame
        self.block = self.block
        self.block_maybe_attach = self.block_maybe_attach

        if id is not None:
            self.id = id 
        else:
            self.id = thread.get_ident()
        self._events = {'call' : self.handle_call, 
                        'line' : self.handle_line, 
                        'return' : self.handle_return, 
                        'exception' : self.handle_exception,
                        'c_call' : self.handle_c_call,
                        'c_return' : self.handle_c_return,
                        'c_exception' : self.handle_c_exception,
                       }
        self.cur_frame = None
        self.stepping = STEPPING_NONE
        self.unblock_work = None
        self._block_lock = thread.allocate_lock()
        self._block_lock.acquire()
        self._block_starting_lock = thread.allocate_lock()
        self._is_blocked = False
        self._is_working = False
        self.stopped_on_line = None
        self.detach = False
        self.prev_trace_func = None
        self.trace_func_stack = []
        self.reported_process_loaded = False
        self.django_stepping = None
        self.is_sending = False
        self.is_importing_stdlib = False
        self.is_importing_stdlib_warned = False

        # stackless changes
        if stackless is not None:
            self._stackless_attach()

        if sys.platform == 'cli':
            self.frames = []

    if sys.platform == 'cli':
        # workaround an IronPython bug where we're sometimes missing the back frames
        # http://ironpython.codeplex.com/workitem/31437
        def push_frame(self, frame):
            self.cur_frame = frame
            self.frames.append(frame)

        def pop_frame(self):
            self.frames.pop()
            self.cur_frame = self.frames[-1]
    else:
        def push_frame(self, frame):
            self.cur_frame = frame

        def pop_frame(self):
            self.cur_frame = self.cur_frame.f_back

    def _stackless_attach(self):
        try:
            stackless.tasklet.trace_function
            stackless.set_schedule_callback(self._stackless_schedule_cb)
        except AttributeError:
            # the tasklets need to be traced on a case by case basis
            # sys.trace needs to be called within their calling context
            def __call__(tsk, *args, **kwargs):
                f = tsk.tempval
                def new_f(old_f, args, kwargs):
                    sys.settrace(self.trace_func)
                    try:
                        if old_f is not None:
                            return old_f(*args, **kwargs)
                    finally:
                        sys.settrace(None)

                tsk.tempval = new_f
                stackless.tasklet.setup(tsk, f, args, kwargs)
                return tsk
    
            def settrace(tsk, tb):
                if hasattr(tsk.frame, "f_trace"):
                    tsk.frame.f_trace = tb
                sys.settrace(tb)

            self.__oldstacklesscall__ = stackless.tasklet.__call__
            stackless.tasklet.settrace = settrace
            stackless.tasklet.__call__ = __call__
        if sys.platform == 'cli':
            self.frames = []
    
    if sys.platform == 'cli':
        # workaround an IronPython bug where we're sometimes missing the back frames
        # http://ironpython.codeplex.com/workitem/31437
        def push_frame(self, frame):
            self.cur_frame = frame
            self.frames.append(frame)
    
        def pop_frame(self):
            self.frames.pop()
            self.cur_frame = self.frames[-1]
    else:
        def push_frame(self, frame):
            self.cur_frame = frame

        def pop_frame(self):
            self.cur_frame = self.cur_frame.f_back

    def context_dispatcher(self, old, new):
        self.stepping = STEPPING_NONE
        # for those tasklets that started before we started tracing
        # we need to make sure that the trace is set by patching
        # it in the context switch
        if old and new:
            if hasattr(new.frame, "f_trace") and not new.frame.f_trace:
                sys.call_tracing(new.settrace,(self.trace_func,))

    def _stackless_schedule_cb(self, prev, next):
        current = stackless.getcurrent()
        if not current:
            return
        current_tf = current.trace_function
        
        try:
            current.trace_function = None
            self.stepping = STEPPING_NONE
            
            # If the current frame has no trace function, we may need to get it
            # from the previous frame, depending on how we ended up in the
            # callback.
            if current_tf is None:
                f_back = current.frame.f_back
                if f_back is not None:
                    current_tf = f_back.f_trace

            if next is not None:
                # Assign our trace function to the current stack
                f = next.frame
                if next is current:
                    f = f.f_back
                while f:
                    if isinstance(f, types.FrameType):
                        f.f_trace = self.trace_func
                    f = f.f_back
                next.trace_function = self.trace_func
        finally:
            current.trace_function = current_tf

    def trace_func(self, frame, event, arg):
        # If we're so far into process shutdown that modules are being unloaded, stop tracing
        # since we can't rely on any modules we've imported to still be working.
        if sys is None or not sys.modules:
            return None
        elif self.is_sending:
            # https://pytools.codeplex.com/workitem/1864 
            # we're currently doing I/O w/ the socket, we don't want to deliver
            # any breakpoints or async breaks because we'll deadlock.  Continue
            # to return the trace function so all of our frames remain
            # balanced.  A better way to deal with this might be to do
            # sys.settrace(None) when we take the send lock, but that's much
            # more difficult because our send context manager is used both
            # inside and outside of the trace function, and so is used when
            # tracing is enabled and disabled, and so it's very easy to get our
            # current frame tracking to be thrown off...
            return self.trace_func

        try:
            # if should_debug_code(frame.f_code) is not true during attach
            # the current frame is None and a pop_frame will cause an exception and 
            # break the debugger
            if self.cur_frame is None:
                # happens during attach, we need frame for blocking
                self.push_frame(frame)
            if self.stepping == STEPPING_BREAK and should_debug_code(frame.f_code):
                if self.detach:
                    if stackless is not None:
                        stackless.set_schedule_callback(None)
                        stackless.tasklet.__call__ = self.__oldstacklesscall__
                    sys.settrace(None)
                    return None

                self.async_break()

            return self._events[event](frame, arg)
        except (StackOverflowException, KeyboardInterrupt):
            # stack overflow, disable tracing
            return self.trace_func

    def handle_call(self, frame, arg):
        f_code = frame.f_code
        co_name = f_code.co_name
        co_filename = f_code.co_filename

        # If we're importing stdlib, don't trace nested calls until we return from the import that started it,
        # but notify the user if these nested calls end up in non-stdlib code.
        if self.is_importing_stdlib:
            if not self.is_importing_stdlib_warned and not co_filename.startswith('<') and should_debug_code(f_code):
                self.is_importing_stdlib_warned = True
                debug_output.write('Standard library module invoked user code during import; breakpoints disabled for invoked code.\n')
            return self.prev_trace_func

        if co_name == '<module>' and co_filename not in ['<string>', '<stdin>']:
            probe_stack()

            module = Module(frame.f_globals.get('__name__') or '', get_code_filename(f_code))
            MODULES.append((co_filename, module))
            if not DETACHED:
                report_module_load(module)

            # If this is top-level code in some stdlib module, then mark this as start of stdlib import,
            # and stop local tracing. Tracing will be re-enabled on the next local trace callback:
            # either line, return, or exception - after we return from this call.
            if is_stdlib(path.normcase(co_filename)):
                self.is_importing_stdlib = True
                return self.prev_trace_func

            if not DETACHED:
                # see if this module causes new break points to be bound
                bound = set()
                for pending_bp in PENDING_BREAKPOINTS:
                    if try_bind_break_point(co_filename, module, pending_bp):
                        bound.add(pending_bp)
                PENDING_BREAKPOINTS.difference_update(bound)

        self.push_frame(frame)

        if DJANGO_BREAKPOINTS:
            source_obj = get_django_frame_source(frame)
            if source_obj is not None:
                origin, (start, end) = source_obj
                
                active_bps = DJANGO_BREAKPOINTS.get(origin.lower())
                should_break = False
                if active_bps is not None:
                    should_break, bkpt_id = active_bps.should_break(start, end)
                    if should_break:
                        probe_stack()
                        update_all_thread_stacks(self)
                        self.block(lambda: (report_breakpoint_hit(bkpt_id, self.id), mark_all_threads_for_break(skip_thread = self)))
                if not should_break and self.django_stepping:
                    self.django_stepping = None
                    self.stepping = STEPPING_OVER
                    self.block_maybe_attach()

        stepping = self.stepping
        if stepping is not STEPPING_NONE and should_debug_code(f_code):
            if stepping == STEPPING_INTO:
                # block when we hit the 1st line, not when we're on the function def
                self.stepping = STEPPING_OVER
                # empty stopped_on_line so that we will break even if it is
                # the same line
                self.stopped_on_line = None
            elif stepping >= STEPPING_OVER:
                self.stepping += 1
            elif stepping <= STEPPING_OUT:
                self.stepping -= 1

        if (sys.platform == 'cli' and 
            co_name == '<module>' and 
            not IPY_SEEN_MODULES.TryGetValue(f_code)[0]):
            IPY_SEEN_MODULES.Add(f_code, None)
            # work around IronPython bug - http://ironpython.codeplex.com/workitem/30127
            self.handle_line(frame, arg)

        # forward call to previous trace function, if any, saving old trace func for when we return
        old_trace_func = self.prev_trace_func
        if old_trace_func is not None:
            self.trace_func_stack.append(old_trace_func)
            self.prev_trace_func = None  # clear first incase old_trace_func stack overflows
            self.prev_trace_func = old_trace_func(frame, 'call', arg)
        
        return self.trace_func

    def should_block_on_frame(self, frame):
        if not should_debug_code(frame.f_code):
            return False
        # It is still possible that we're somewhere in standard library code, but that code was invoked by our
        # internal debugger machinery (e.g. socket.sendall or text encoding while tee'ing print output to VS).
        # We don't want to block on any of that, either, so walk the stack and see if we hit debugger frames
        # at some point below the non-debugger ones.
        while frame is not None:
            # There is usually going to be a debugger frame at the very bottom of the stack - the one that
            # invoked user code on this thread when starting debugging. If we reached that, then everything
            # above is user code, so we know that we do want to block here.
            if frame.f_code in DEBUG_ENTRYPOINTS:
                break
            # Otherwise, check if it's some other debugger code.
            filename = path.normcase(frame.f_code.co_filename)
            is_debugger_frame = False
            if is_dont_debug(filename):
                # If it is, then the frames above it on the stack that we have just walked through
                # were for debugger internal purposes, and we do not want to block here.
                return False
            frame = frame.f_back
        return True

    def handle_line(self, frame, arg):
        self.is_importing_stdlib = False

        if not DETACHED:
            # resolve whether step_complete and/or handling_breakpoints
            step_complete = False
            handle_breakpoints = True
            stepping = self.stepping
            if stepping is not STEPPING_NONE:   # check for the common case of no stepping first...
                if ((stepping == STEPPING_OVER or stepping == STEPPING_INTO) and frame.f_lineno != self.stopped_on_line):
                    if self.should_block_on_frame(frame):   # don't step complete in our own debugger / non-user code
                        step_complete = True
                elif stepping == STEPPING_LAUNCH_BREAK or stepping == STEPPING_ATTACH_BREAK:
                    # If launching rather than attaching, don't break into initial Python code needed to set things up
                    if stepping == STEPPING_LAUNCH_BREAK and (not MODULES or not self.should_block_on_frame(frame)):
                        handle_breakpoints = False
                    else:
                        step_complete = True

            # handle breakpoints
            hit_bp_id = None
            if BREAKPOINTS and handle_breakpoints:
                bp = BREAKPOINTS.get(frame.f_lineno)
                if bp is not None:
                    for (filename, bp_id), bp in bp.items():
                        if filename != frame.f_code.co_filename:
                            # When the breakpoint is bound, the filename is updated to match co_filename of
                            # the module to which it was bound, so only exact matches are considered hits.
                            if bp.is_bound:
                                continue
                            # Otherwise, use relaxed path check that tries to handle differences between 
                            # local and remote filesystems for remote scenarios:
                            if not breakpoint_path_match(filename, frame.f_code.co_filename):
                                continue

                        # If we got here, filename and line number both match.

                        # Check condition to see if we actually hit this breakpoint.
                        if bp.condition_kind != BREAKPOINT_CONDITION_ALWAYS:
                            try:
                                res = eval(bp.condition, frame.f_globals, frame.f_locals)
                                if bp.condition_kind == BREAKPOINT_CONDITION_WHEN_CHANGED:
                                    last_val = bp.last_condition_value
                                    bp.last_condition_value = res
                                    if last_val == res:
                                        # Condition didn't change, breakpoint not hit.
                                        continue
                                else:
                                    if not res:
                                        # Condition isn't true, breakpoint not hit.
                                        continue
                            except:
                                # If anything goes wrong while evaluating condition, breakpoint is hit.
                                pass

                        # If we got here, then condition matched, and we need to update the hit count
                        # (even if we don't end up signaling the breakpoint because of pass count).
                        bp.hit_count += 1

                        # Check the new hit count against pass count.
                        if bp.pass_count_kind != BREAKPOINT_PASS_COUNT_ALWAYS:
                            pass_count_kind = bp.pass_count_kind
                            pass_count = bp.pass_count
                            hit_count = bp.hit_count
                            if pass_count_kind == BREAKPOINT_PASS_COUNT_EVERY:
                                if (hit_count % pass_count) != 0:
                                    continue
                            elif pass_count_kind == BREAKPOINT_PASS_COUNT_WHEN_EQUAL:
                                if hit_count != pass_count:
                                    continue
                            elif pass_count_kind == BREAKPOINT_PASS_COUNT_WHEN_EQUAL_OR_GREATER:
                                if hit_count < pass_count:
                                    continue

                        # If we got here, then condition and pass count both match, so we should notify VS.
                        hit_bp_id = bp_id

                        # There may be other breakpoints for the same file/line, and we need to update
                        # their hit counts, too, so keep looping. If more than one is hit, it's fine,
                        # we will just signal the last one.

            if hit_bp_id is not None:
                # handle case where both hitting a breakpoint and step complete by reporting the breakpoint
                # if the reported breakpoint is a tracepoint, report the step complete if/when the tracepoint is auto-resumed
                probe_stack()
                update_all_thread_stacks(self)
                self.block(lambda: (report_breakpoint_hit(hit_bp_id, self.id), mark_all_threads_for_break(skip_thread = self)), step_complete)

            elif step_complete:
                self.block_maybe_attach()

        # forward call to previous trace function, if any, updating trace function appropriately
        old_trace_func = self.prev_trace_func
        if old_trace_func is not None:
            self.prev_trace_func = None  # clear first incase old_trace_func stack overflows
            self.prev_trace_func = old_trace_func(frame, 'line', arg)

        return self.trace_func
    
    def handle_return(self, frame, arg):
        self.is_importing_stdlib = False
        self.pop_frame()

        if not DETACHED:
            stepping = self.stepping
            # only update stepping state when this frame is debuggable (matching handle_call)
            if stepping is not STEPPING_NONE and should_debug_code(frame.f_code):
                if stepping > STEPPING_OVER:
                    self.stepping -= 1
                elif stepping < STEPPING_OUT:
                    self.stepping += 1
                elif stepping in USER_STEPPING:
                    if self.cur_frame is None or frame.f_code.co_name == "<module>" :
                        # only return to user code modules
                        if self.should_block_on_frame(frame):
                            # restore back the module frame for the step out of a module
                            self.push_frame(ModuleExitFrame(frame))
                            self.stepping = STEPPING_NONE
                            update_all_thread_stacks(self)
                            self.block(lambda: (report_step_finished(self.id), mark_all_threads_for_break(skip_thread = self)))
                            self.pop_frame()
                    elif self.should_block_on_frame(self.cur_frame):
                        # if we're returning into non-user code then don't block in the
                        # non-user code, wait until we hit user code again
                        self.stepping = STEPPING_NONE
                        update_all_thread_stacks(self)
                        self.block(lambda: (report_step_finished(self.id), mark_all_threads_for_break(skip_thread = self)))

        # forward call to previous trace function, if any
        old_trace_func = self.prev_trace_func
        if old_trace_func is not None:
            old_trace_func(frame, 'return', arg)

        # restore previous frames trace function if there is one
        if self.trace_func_stack:
            self.prev_trace_func = self.trace_func_stack.pop()
        
    def handle_exception(self, frame, arg):
        self.is_importing_stdlib = False

        if self.stepping == STEPPING_ATTACH_BREAK:
            self.block_maybe_attach()

        if not DETACHED and should_debug_code(frame.f_code):
            break_type = BREAK_ON.should_break(self, *arg)
            if break_type:
                update_all_thread_stacks(self)
                self.block(lambda: report_exception(frame, arg, self.id, break_type))

        # forward call to previous trace function, if any, updating the current trace function
        # with a new one if available
        old_trace_func = self.prev_trace_func
        if old_trace_func is not None:
            self.prev_trace_func = old_trace_func(frame, 'exception', arg)

        return self.trace_func
        
    def handle_c_call(self, frame, arg):
        # break points?
        pass
        
    def handle_c_return(self, frame, arg):
        # step out of ?
        pass
        
    def handle_c_exception(self, frame, arg):
        pass

    def block_maybe_attach(self):
        will_block_now = True
        if self.stepping == STEPPING_ATTACH_BREAK:
            # only one thread should send the attach break in
            attach_lock.acquire()
            global attach_sent_break
            if attach_sent_break:
                will_block_now = False
            attach_sent_break = True
            attach_lock.release()
    
        probe_stack()
        stepping = self.stepping
        self.stepping = STEPPING_NONE
        def block_cond():
            if will_block_now:
                if stepping == STEPPING_OVER or stepping == STEPPING_INTO:
                    report_step_finished(self.id)
                    return mark_all_threads_for_break(skip_thread = self)
                else:
                    if not DETACHED:
                        if stepping == STEPPING_ATTACH_BREAK:
                            self.reported_process_loaded = True
                        return report_process_loaded(self.id)
        update_all_thread_stacks(self)
        self.block(block_cond)
    
    def async_break(self):
        def async_break_send():
            sent_break_complete = False
            global SEND_BREAK_COMPLETE
            if SEND_BREAK_COMPLETE == True or SEND_BREAK_COMPLETE == self.id:
                # multiple threads could be sending this...
                SEND_BREAK_COMPLETE = False
                sent_break_complete = True
                send_debug_event(
                    name='legacyAsyncBreak',
                    threadId=self.id,
                )

            if sent_break_complete:
                # if we have threads which have not broken yet capture their frame list and 
                # send it now.  If they block we'll send an updated (and possibly more accurate - if
                # there are any thread locals) list of frames.
                update_all_thread_stacks(self)

        self.stepping = STEPPING_NONE
        self.block(async_break_send)

    def block(self, block_lambda, keep_stopped_on_line = False):
        """blocks the current thread until the debugger resumes it"""
        assert not self._is_blocked
        #assert self.id == thread.get_ident(), 'wrong thread identity' + str(self.id) + ' ' + str(thread.get_ident())    # we should only ever block ourselves
        
        # send thread frames before we block
        self.enum_thread_frames_locally()
        
        if not keep_stopped_on_line:
            self.stopped_on_line = self.cur_frame.f_lineno

        # need to synchronize w/ sending the reason we're blocking
        self._block_starting_lock.acquire()
        self._is_blocked = True
        block_lambda()
        self._block_starting_lock.release()

        while not DETACHED:
            self._block_lock.acquire()
            if self.unblock_work is None:
                break

            # the debugger wants us to do something, do it, and then block again
            self._is_working = True
            self.unblock_work()
            self.unblock_work = None
            self._is_working = False
                
        self._block_starting_lock.acquire()
        assert self._is_blocked
        self._is_blocked = False
        self._block_starting_lock.release()

    def unblock(self):
        """unblocks the current thread allowing it to continue to run"""
        assert self._is_blocked 
        assert self.id != thread.get_ident()    # only someone else should unblock us
        
        self._block_lock.release()

    def schedule_work(self, work):
        self.unblock_work = work
        self.unblock()

    def run_on_thread(self, text, cur_frame, execution_id, frame_kind, print_result, repr_kind = PYTHON_EVALUATION_RESULT_REPR_KIND_NORMAL):
        self._block_starting_lock.acquire()
        
        if not self._is_blocked:
            report_execution_error('<expression cannot be evaluated at this time>', execution_id)
        elif not self._is_working:
            self.schedule_work(lambda : self.run_locally(text, cur_frame, execution_id, frame_kind, print_result, repr_kind))
        else:
            report_execution_error('<error: previous evaluation has not completed>', execution_id)

        self._block_starting_lock.release()

    def run_on_thread_no_report(self, text, cur_frame, frame_kind):
        self._block_starting_lock.acquire()

        if not self._is_blocked:
            pass
        elif not self._is_working:
            self.schedule_work(lambda : self.run_locally_no_report(text, cur_frame, frame_kind))
        else:
            pass

        self._block_starting_lock.release()

    def enum_child_on_thread(self, text, cur_frame, execution_id, frame_kind):
        self._block_starting_lock.acquire()
        if not self._is_working and self._is_blocked:
            self.schedule_work(lambda : self.enum_child_locally(text, cur_frame, execution_id, frame_kind))
            self._block_starting_lock.release()
        else:
            self._block_starting_lock.release()
            report_children(execution_id, [])

    def get_locals(self, cur_frame, frame_kind):
        if frame_kind == FRAME_KIND_DJANGO:
            locs = {}
            # iterate going forward, so later items replace earlier items
            for d in cur_frame.f_locals['context'].dicts:
                # hasattr check to defend against someone passing a bad dictionary value
                # and us breaking the app.
                if hasattr(d, 'keys') and d != DJANGO_BUILTINS:
                    for key in d.keys():
                        locs[key] = d[key]
        else:
            locs = cur_frame.f_locals
        return locs

    def locals_to_fast(self, frame):
        try:
            ltf = ctypes.pythonapi.PyFrame_LocalsToFast
            ltf.argtypes = [ctypes.py_object, ctypes.c_int]
            ltf(frame, 1)
        except:
            pass

    def run_locally(self, text, cur_frame, execution_id, frame_kind, print_result, repr_kind = PYTHON_EVALUATION_RESULT_REPR_KIND_NORMAL):
        try:
            code = compile_eval_or_exec(text)
            res = eval(code, cur_frame.f_globals, self.get_locals(cur_frame, frame_kind))
            self.locals_to_fast(cur_frame)
            # Report any updated variable values first
            self.enum_thread_frames_locally()
            if print_result:
                sys.displayhook(res)
            report_execution_result(execution_id, res, repr_kind)
        except:
            # Report any updated variable values first
            self.enum_thread_frames_locally()
            if print_result:
                exc_type, exc_value, exc_tb = sys.exc_info()
                _vspr.print_exception_frames(exc_type, exc_value, exc_tb)
            report_execution_exception(execution_id, sys.exc_info())

    def run_locally_no_report(self, text, cur_frame, frame_kind):
        code = compile_eval_or_exec(text)
        res = eval(code, cur_frame.f_globals, self.get_locals(cur_frame, frame_kind))
        self.locals_to_fast(cur_frame)
        sys.displayhook(res)

    def enum_child_locally(self, expr, cur_frame, execution_id, frame_kind):
        try:
            code = compile(expr, cur_frame.f_code.co_name, 'eval')
            res = eval(code, cur_frame.f_globals, self.get_locals(cur_frame, frame_kind))

            children = [] # [(name, expression, value, flags)]

            # Process attributes.

            cls_dir = set(dir(type(res)))
            res_dict = getattr(res, '__dict__', {})
            res_slots = set(getattr(res, '__slots__', ()))

            for attr_name in dir(res):
                try:
                    # Skip special attributes.
                    if attr_name.startswith('__') and attr_name.endswith('__'):
                        continue
                    attr_value = getattr(res, attr_name)
                    # If it comes from the class and is not shadowed by any instance attribute, filter it out if it looks like a method.
                    if attr_name in cls_dir and attr_name not in res_dict and attr_name not in res_slots:
                        if isinstance(attr_value, METHOD_TYPES):
                            continue
                    children.append((attr_name, expr + '.' + attr_name, attr_value, 0))
                except:
                    # Skip this attribute if we can't process it.
                    pass

            # Process items, if this is a collection.

            try:
                if hasattr(res, '__iter__') and iter(res) is res:
                    # An iterable object that is its own iterator - iterators, generators, enumerate() etc. These can only be iterated once, so
                    # don't try to iterate them immediately. Instead, provide a child item that will do so when expanded, to give user full control.
                    children.append(('Results View', 'tuple(' + expr + ')', SynthesizedValue('Expanding the Results View will run the iterator'), PYTHON_EVALUATION_RESULT_METHOD_CALL | PYTHON_EVALUATION_RESULT_SIDE_EFFECTS))
                    enum = ()
                elif isinstance(res, dict) or (hasattr(res, 'items') and hasattr(res, 'has_key')):
                    # Dictionary-like object.
                    try:
                        enum = res.viewitems()
                        enum_expr = expr + '.viewitems()'
                        children.append(('viewitems()', enum_expr, SynthesizedValue(), PYTHON_EVALUATION_RESULT_METHOD_CALL))
                    except:
                        enum = res.items()
                        enum_expr = expr + '.items()'
                        children.append(('items()', enum_expr, SynthesizedValue(), PYTHON_EVALUATION_RESULT_METHOD_CALL))
                    enum_var = '(k, v)'
                    enum = enumerate(enum)
                else:
                    # Indexable or enumerable object.
                    enum = enumerate(enumerate(res))
                    enum_expr = expr
                    enum_var = 'v'
            except:
                enum = ()

            for index, (key, item) in enum:
                try:
                    if len(children) > 10000:
                        # Report at most 10000 items.
                        children.append(('[...]', None, 'Evaluation halted because sequence has too many items', 0))
                        break

                    key_repr = safe_repr(key)
                        
                    # Some objects are enumerable but not indexable, or repr(key) is not a valid Python expression. For those, we
                    # cannot use obj[key] to get the item by its key, and have to retrieve it by index from enumerate() instead.
                    try:
                        item_by_key = res[eval_repr(key)]
                        use_index = item is not item_by_key
                    except:
                        use_index = True
                    else:
                        use_index = False

                    item_name = '[' + key_repr + ']'
                    if use_index:
                        item_expr = 'next((v for i, %s in enumerate(%s) if i == %s))' % (enum_var, enum_expr, index)
                    else:
                        item_expr = expr + item_name

                    children.append((item_name, item_expr, item, 0))

                except:
                    # Skip this item if we can't process it.
                    pass

            report_children(execution_id, children)

        except:
            report_children(execution_id, [])

    def get_frame_list(self):
        frames = []
        cur_frame = self.cur_frame
        
        while should_send_frame(cur_frame):
            # calculate the ending line number
            lineno = cur_frame.f_code.co_firstlineno
            try:
                linetable = cur_frame.f_code.co_lnotab
            except:
                try:
                    lineno = cur_frame.f_code.Span.End.Line
                except:
                    lineno = -1
            else:
                for line_incr in linetable[1::2]:
                    if sys.version >= '3':
                        lineno += line_incr
                    else:
                        lineno += ord(line_incr)

            frame_locals = cur_frame.f_locals
            var_names = cur_frame.f_code.co_varnames

            source_obj = None
            if DJANGO_DEBUG:
                source_obj = get_django_frame_source(cur_frame)
                if source_obj is not None:
                    frame_locals = self.get_locals(cur_frame, FRAME_KIND_DJANGO)
                    var_names = frame_locals

            if source_obj is not None:
                process_globals_in_functions = False
            elif frame_locals is cur_frame.f_globals:
                var_names = frame_locals
                process_globals_in_functions = False
            else:
                process_globals_in_functions = True

            # collect frame locals
            vars = []
            treated = set()
            self.collect_variables(vars, frame_locals, var_names, treated)
            if process_globals_in_functions:
                # collect closed over variables used locally (frame_locals not already treated based on var_names)
                self.collect_variables(vars, frame_locals, frame_locals, treated)
                # collect globals used locally, skipping undefined found in builtins
                f_globals = cur_frame.f_globals
                if f_globals: # ensure globals to work with (IPy may have None for cur_frame.f_globals for frames within stdlib)
                    self.collect_variables(
                        vars,
                        f_globals,
                        getattr(cur_frame.f_code, 'co_names', ()),
                        treated,
                        skip_unknown = True
                    )
            
            frame_info = None

            if source_obj is not None:
                origin, (start, end) = source_obj

                filename = str(origin)
                bp_info = DJANGO_BREAKPOINTS.get(filename.lower())
                if bp_info is None:
                    DJANGO_BREAKPOINTS[filename.lower()] = bp_info = DjangoBreakpointInfo(filename)

                low_line, hi_line = bp_info.get_line_range(start, end)
                if low_line is not None and hi_line is not None:
                    frame_kind = FRAME_KIND_DJANGO
                    frame_info = (
                        low_line + 1,
                        hi_line + 1, 
                        low_line + 1, 
                        cur_frame.f_code.co_name,
                        str(origin),
                        0,
                        vars,
                        FRAME_KIND_DJANGO,
                        get_code_filename(cur_frame.f_code),
                        cur_frame.f_lineno
                    )

            if frame_info is None:
                frame_info = (
                    cur_frame.f_code.co_firstlineno,
                    lineno, 
                    cur_frame.f_lineno, 
                    cur_frame.f_code.co_name,
                    get_code_filename(cur_frame.f_code),
                    cur_frame.f_code.co_argcount,
                    vars,
                    FRAME_KIND_PYTHON,
                    None,
                    None
                )

            frames.append(frame_info)
        
            cur_frame = cur_frame.f_back
                        
        return frames

    def collect_variables(self, vars, objects, names, treated, skip_unknown = False):
        for name in names:
            if name not in treated:
                try:
                    obj = objects[name]
                    try:
                        if sys.version[0] == '2' and type(obj) is types.InstanceType:
                            type_name = "instance (" + obj.__class__.__name__ + ")"
                        else:
                            type_name = type(obj).__name__
                    except:
                        type_name = 'unknown'
                except:
                    if skip_unknown:
                        continue
                    obj = SynthesizedValue('<undefined>', len_value=0)
                    type_name = 'unknown'
                vars.append((name, type(obj), safe_repr(obj), safe_hex_repr(obj), type_name, get_object_len(obj)))
                treated.add(name)

    def send_frame_list(self, frames, thread_name = None):
        threadFrames = []

        for firstlineno, lineno, curlineno, name, filename, argcount, variables, frameKind, sourceFile, sourceLine in frames:
            threadFrame = {
                'startLine': firstlineno,
                'endLine': lineno,
                'lineNo': curlineno,
                'frameName': name,
                'fileName': filename,
                'argCount': argcount,
                'frameKind': frameKind,
                'variables': [{
                    'name': name,
                    'obj': create_object(type_obj, safe_repr_obj, hex_repr_obj, type_name, obj_len)
                    } for name, type_obj, safe_repr_obj, hex_repr_obj, type_name, obj_len in variables
                ]
            }

            if frameKind == FRAME_KIND_DJANGO:
                threadFrame['djangoSourceFile'] = sourceFile
                threadFrame['djangoSourceLine'] = sourceLine

            threadFrames.append(threadFrame)

        send_debug_event(
            name='legacyThreadFrameList',
            threadId=self.id,
            threadName=thread_name,
            threadFrames=threadFrames,
        )

    def enum_thread_frames_locally(self):
        global _threading
        if _threading is None:
            import threading
            _threading = threading
        self.send_frame_list(self.get_frame_list(), getattr(_threading.currentThread(), 'name', 'Python Thread'))

class Module(object):
    """tracks information about a loaded module"""

    CurrentLoadIndex = itertools.count()

    def __init__(self, module_name, filename):
        self.module_id = next(Module.CurrentLoadIndex)
        self.module_name = module_name
        self.filename = filename

def get_code(func):
    return getattr(func, 'func_code', None) or getattr(func, '__code__', None)

class DebuggerExitException(Exception): pass

def add_break_point(bp):
    cur_bp = BREAKPOINTS.get(bp.lineno)
    if cur_bp is None:
        cur_bp = BREAKPOINTS[bp.lineno] = dict()
    cur_bp[(bp.filename, bp.breakpoint_id)] = bp

def try_bind_break_point(mod_filename, module, bp):
    if breakpoint_path_match(bp.filename,module.filename):
        bp.filename = mod_filename
        bp.is_bound = True
        add_break_point(bp)
        report_breakpoint_bound(bp.breakpoint_id)
        return True
    return False

def mark_all_threads_for_break(stepping = STEPPING_BREAK, skip_thread = None):
    THREADS_LOCK.acquire()
    try:
        for thread in THREADS.values():
            if thread is skip_thread:
                continue
            thread.stepping = stepping
    finally:
        THREADS_LOCK.release()


class DebuggerLoop(_vsipc.SocketIO, _vsipc.IpcChannel):

    instance = None

    def __init__(self, socket):
        super(DebuggerLoop, self).__init__(socket=socket)
        
        DebuggerLoop.instance = self
        self._cur_repl_modules = set()

    def loop(self):
        try:
            while True:
                if self.process_one_message():
                    break
        except DebuggerExitException:
            pass
        except socket.error:
            pass
        except:
            traceback.print_exc()

        global debugger_thread_id
        debugger_thread_id = -1
        DebuggerLoop.instance = None

    def on_legacyStepInto(self, request, args):
        thread = get_thread_from_id(args['threadId'])

        self.send_debug_response(request)

        if thread is not None:
            assert thread._is_blocked
            thread.stepping = STEPPING_INTO
            self._resume_all()

    def on_legacyStepOut(self, request, args):
        thread = get_thread_from_id(args['threadId'])

        self.send_debug_response(request)

        if thread is not None:
            assert thread._is_blocked
            thread.stepping = STEPPING_OUT
            self._resume_all()

    def on_legacyStepOver(self, request, args):
        # set step over
        thread = get_thread_from_id(args['threadId'])

        self.send_debug_response(request)

        if thread is not None:
            assert thread._is_blocked
            if DJANGO_DEBUG:
                source_obj = get_django_frame_source(thread.cur_frame)
                if source_obj is not None:
                    thread.django_stepping = True
                    self._resume_all()
                    return

            thread.stepping = STEPPING_OVER
            self._resume_all()

    def on_legacySetBreakpoint(self, request, args):
        breakpoint_id = args['breakpointId']
        lineno = args['breakpointLineNo']
        filename = args['breakpointFileName']
        condition_kind = args['conditionKind']
        condition = args['condition']
        pass_count_kind = args['passCountKind']
        pass_count = args['passCount']
        language = args['language']

        if language != LANGUAGE_PYTHON and language != LANGUAGE_DJANGO:
            self.send_debug_response(request, success=False, message='Unknown language')
            return

        self.send_debug_response(request)

        if language == LANGUAGE_PYTHON:
            bp = BreakpointInfo(breakpoint_id, filename, lineno, condition_kind, condition, pass_count_kind, pass_count)
            for mod_filename, module in MODULES:
                if try_bind_break_point(mod_filename, module, bp):
                    break
            else:
                # Failed to bind break point (e.g. module is not loaded yet); report as pending.
                add_break_point(bp)
                PENDING_BREAKPOINTS.add(bp)
                report_breakpoint_failed(breakpoint_id)
        elif language == LANGUAGE_DJANGO:
            bp_info = DJANGO_BREAKPOINTS.get(filename.lower())
            if bp_info is None:
                DJANGO_BREAKPOINTS[filename.lower()] = bp_info = DjangoBreakpointInfo(filename)
            bp_info.add_breakpoint(lineno, breakpoint_id)

    def on_legacySetBreakpointCondition(self, request, args):
        breakpoint_id = args['breakpointId']
        kind = args['conditionKind']
        condition = args['condition']

        self.send_debug_response(request)

        bp = BreakpointInfo.find_by_id(breakpoint_id)
        if bp is not None:
            bp.condition_kind = kind
            bp.condition = condition

    def on_legacySetBreakpointPassCount(self, request, args):
        breakpoint_id = args['breakpointId']
        kind = args['passCountKind']
        count = args['passCount']

        self.send_debug_response(request)

        bp = BreakpointInfo.find_by_id(breakpoint_id)
        if bp is not None:
            bp.pass_count_kind = kind
            bp.pass_count = count

    def on_legacySetBreakpointHitCount(self, request, args):
        breakpoint_id = args['breakpointId']
        count = args['hitCount']

        self.send_debug_response(request)

        bp = BreakpointInfo.find_by_id(breakpoint_id)
        if bp is not None:
            bp.hit_count = count

    def on_legacyGetBreakpointHitCount(self, request, args):
        breakpoint_id = args['breakpointId']
        
        bp = BreakpointInfo.find_by_id(breakpoint_id)
        count = 0
        if bp is not None:
            count = bp.hit_count

        self.send_debug_response(
            request,
            success=True,
            message=None,
            hitCount=count,
        )

    def on_legacyRemoveBreakpoint(self, request, args):
        lineno = args['breakpointLineNo']
        brkpt_id = args['breakpointId']
        language = args['language']

        if language != LANGUAGE_PYTHON and language != LANGUAGE_DJANGO:
            self.send_debug_response(request, success=False, message='Unknown language')
            return

        self.send_debug_response(request)

        if language == LANGUAGE_PYTHON:
            cur_bp = BREAKPOINTS.get(lineno)
            if cur_bp is not None:
                for file, id in cur_bp:
                    if id == brkpt_id:
                        del cur_bp[file, id]
                        if not cur_bp:
                            del BREAKPOINTS[lineno]
                        break
        elif language == LANGUAGE_DJANGO:
            filename = args['breakpointFileName']
            bp_info = DJANGO_BREAKPOINTS.get(filename.lower())
            if bp_info is not None:
                bp_info.remove_breakpoint(lineno)

    def on_legacyBreakAll(self, request, args):
        self.send_debug_response(request)

        global SEND_BREAK_COMPLETE
        SEND_BREAK_COMPLETE = True
        mark_all_threads_for_break()

    def on_legacyGetThreadFrames(self, request, args):
        thread = get_thread_from_id(args['threadId'])

        self.send_debug_response(request)

        if thread is not None:
            thread.enum_thread_frames_locally()

    def on_legacyResumeAll(self, request, args):
        self.send_debug_response(request)
        self._resume_all()

    def _resume_all(self):
        # resume all
        THREADS_LOCK.acquire()
        try:
            all_threads = list(THREADS.values())
        finally:
            THREADS_LOCK.release()

        for thread in all_threads:
            thread._block_starting_lock.acquire()
            if thread.stepping == STEPPING_BREAK or thread.stepping == STEPPING_ATTACH_BREAK:
                thread.stepping = STEPPING_NONE
            if thread._is_blocked:
                thread.unblock()
            thread._block_starting_lock.release()

    def on_legacyResumeThread(self, request, args):
        thread = get_thread_from_id(args['threadId'])

        self.send_debug_response(request)

        if thread is not None:
            if thread.reported_process_loaded:
                thread.reported_process_loaded = False
                self._resume_all()
            else:
                thread.unblock()

    def on_legacyAutoResumeThread(self, request, args):
        thread = get_thread_from_id(args['threadId'])

        self.send_debug_response(request)

        if thread is not None:
            stepping = thread.stepping
            if ((stepping == STEPPING_OVER or stepping == STEPPING_INTO) and thread.cur_frame.f_lineno != thread.stopped_on_line): 
                report_step_finished(tid)
            else:
                self._resume_all()

    def on_legacySetExceptionInfo(self, request, args):
        self.send_debug_response(request)

        BREAK_ON.clear()
        BREAK_ON.default_mode = args['defaultBreakOnMode']

        for item in args['breakOn']:
            BREAK_ON.add_exception(item['name'], item['mode'])

    def on_legacySetExceptionHandlerInfo(self, request, args):
        self.send_debug_response(request)

        try:
            filename = args['fileName']

            handlers = []
            for statement in args['statements']:
                line_start = statement['lineStart']
                line_end = statement['lineEnd']

                expressions = set()
                for exp in statement['expressions']:
                    expressions.add(exp)

                if not expressions:
                    expressions = set('*')

                handlers.append((line_start, line_end, expressions))

            BREAK_ON.handler_cache[filename] = handlers
        finally:
            BREAK_ON.handler_lock.release()

    def on_legacyClearStepping(self, request, args):
        thread = get_thread_from_id(args['threadId'])

        self.send_debug_response(request)

        if thread is not None:
            thread.stepping = STEPPING_NONE

    def on_legacySetLineNumber(self, request, args):
        tid = args['threadId']
        fid = args['frameId']
        lineno = args['lineNo']
        try:
            THREADS_LOCK.acquire()
            try:
                THREADS[tid].cur_frame.f_lineno = lineno
                newline = THREADS[tid].cur_frame.f_lineno
            finally:
                THREADS_LOCK.release()

            self.send_debug_response(
                request,
                success=True,
                message=None,
                result=1,
                threadId=tid,
                newLineNo=newline,
            )
        except:
            self.send_debug_response(
                request,
                success=True,
                message=None,
                result=0,
                threadId=tid,
                newLineNo=0,
            )

    def on_legacyExecuteText(self, request, args):
        # execute given text in specified frame
        text = args['text']
        tid = args['threadId']
        fid = args['frameId']
        eid = args['executionId']
        frame_kind = args['frameKind']
        repr_kind = args['reprKind']
        module_name = args['moduleName']
        print_result = args['printResult']

        self.send_debug_response(request)

        if module_name:
            self.execute_code_in_module(text, module_name, eid, print_result, repr_kind)
        else:
            thread, cur_frame = self.get_thread_and_frame(tid, fid, frame_kind)
            if thread is not None and cur_frame is not None:
                thread.run_on_thread(text, cur_frame, eid, frame_kind, print_result, repr_kind)

        # keep track of the module set so the debug REPL can update its available scopes
        new_modules = _vspr.get_cur_module_set()
        try:
            if new_modules != self._cur_repl_modules:
                self.send_debug_event(name='legacyModulesChanged')
        except:
            pass
        self._cur_repl_modules = new_modules

    def execute_code_in_module(self, text, module_name, execution_id, print_result, repr_kind):
        try:
            mod = sys.modules.get(module_name)
            if mod is not None:
                code = compile_eval_or_exec(text)
                res = eval(code, mod.__dict__, mod.__dict__)
                if print_result:
                    sys.displayhook(res)
                report_execution_result(execution_id, res, repr_kind)
            else:
                stderr.write("Unknown module '{0}'\n".format(module_name))
                report_execution_exception(execution_id, sys.exc_info())
        except:
            exc_type, exc_value, exc_tb = sys.exc_info()
            _vspr.print_exception_frames(exc_type, exc_value, exc_tb)
            report_execution_exception(execution_id, sys.exc_info())

    def execute_code_no_report(self, text, tid, fid, frame_kind):
        # execute given text in specified frame, without sending back the results
        thread, cur_frame = self.get_thread_and_frame(tid, fid, frame_kind)
        if thread is not None and cur_frame is not None:
            thread.run_locally_no_report(text, cur_frame, frame_kind)

    def on_legacyEnumChildren(self, request, args):
        # execute given text in specified frame
        text = args['text']
        tid = args['threadId']
        fid = args['frameId']
        eid = args['executionId']
        frame_kind = args['frameKind']

        self.send_debug_response(request)

        thread, cur_frame = self.get_thread_and_frame(tid, fid, frame_kind)
        if thread is not None and cur_frame is not None:
            thread.enum_child_on_thread(text, cur_frame, eid, frame_kind)

    def get_thread_and_frame(self, tid, fid, frame_kind):
        thread = get_thread_from_id(tid)
        cur_frame = None

        if thread is not None:
            cur_frame = thread.cur_frame
            for i in xrange(fid):
                cur_frame = cur_frame.f_back

        return thread, cur_frame

    def on_legacyDetach(self, request, args):
        self.send_debug_response(request)
        self.detach()

    def detach(self):
        detach_threads()

        # unload debugger DLL
        global debugger_dll_handle
        if debugger_dll_handle is not None:
            k32 = ctypes.WinDLL('kernel32')
            k32.FreeLibrary.argtypes = [ctypes.c_void_p]
            k32.FreeLibrary(debugger_dll_handle)
            debugger_dll_handle = None

        self.send_debug_event(name='legacyDetach')
        detach_process()

        for callback in DETACH_CALLBACKS:
            callback()

        raise DebuggerExitException()

    def on_legacyLastAck(self, request, args):
        self.send_debug_response(request)
        last_ack_event.set()

    def on_legacyListReplModules(self, request, args):
        try:
            res = _vspr.get_module_names()
            res.sort()
        except:
            res = []

        self.send_debug_response(
            request,
            modules=[dict(name=m[0], fileName=m[1]) for m in res]
        )

    def send_debug_event(self, name, **args):
        with _SendLockCtx:
            self.send_event(name, **args)

    def send_debug_response(self, request, success=True, message=None, **args):
        with _SendLockCtx:
            self.send_response(request, success, message, **args)

def send_debug_event(name, **args):
    if DebuggerLoop.instance:
        DebuggerLoop.instance.send_debug_event(name, **args)

DETACH_CALLBACKS = []

def new_thread_wrapper(func, posargs, kwargs):
    cur_thread = new_thread()
    try:
        sys.settrace(cur_thread.trace_func)
        func(*posargs, **kwargs)
    finally:
        THREADS_LOCK.acquire()
        try:
            if not cur_thread.detach:
                del THREADS[cur_thread.id]
        finally:
            THREADS_LOCK.release()

        if not DETACHED:
            report_thread_exit(cur_thread)

def report_new_thread(new_thread):
    ident = new_thread.id
    send_debug_event(name='legacyThreadCreate', threadId=ident)

def report_all_threads():
    THREADS_LOCK.acquire()
    try:
        all_threads = list(THREADS.values())
    finally:
        THREADS_LOCK.release()

    for cur_thread in all_threads:
        report_new_thread(cur_thread)

def report_thread_exit(old_thread):
    ident = old_thread.id
    send_debug_event(name='legacyThreadExit', threadId=ident)

def report_exception(frame, exc_info, tid, break_type):
    exc_type = exc_info[0]
    exc_value = exc_info[1]
    tb_value = exc_info[2]
    
    if type(exc_value) is tuple:
        # exception object hasn't been created yet, create it now 
        # so we can get the correct msg.
        exc_value = exc_type(*exc_value)
    
    data = {
        'typename': get_exception_name(exc_type),
        'message': str(exc_value),
    }
    if break_type == BREAK_TYPE_UNHANDLED:
        data['breaktype'] = 'unhandled'
    if tb_value:
        try:
            data['trace'] = '\n'.join(','.join(repr(v) for v in line) for line in traceback.extract_tb(tb_value))
        except:
            pass
    if not DJANGO_DEBUG or get_django_frame_source(frame) is None:
        data['excvalue'] = '__exception_info'
        i = 0
        while data['excvalue'] in frame.f_locals:
            i += 1
            data['excvalue'] = '__exception_info_%d' % i
        frame.f_locals[data['excvalue']] = {
            'exception': exc_value,
            'exception_type': exc_type,
            'message': data['message'],
        }

    send_debug_event(
        name='legacyException',
        threadId=tid,
        data=dict((k, str(v)) for k, v in data.items()),
    )

def report_module_load(mod):
    filename = path.normcase(mod.filename)
    if is_dont_debug(filename):
        return

    send_debug_event(
        name='legacyModuleLoad',
        moduleId=mod.module_id,
        moduleFileName=mod.filename,
        moduleName=mod.module_name,
        isStdLib=is_stdlib(filename),
    )

def report_step_finished(tid):
    send_debug_event(
        name='legacyStepDone',
        threadId=tid,
    )

def report_breakpoint_bound(id):
    send_debug_event(
        name='legacyBreakpointSet',
        breakpointId=id,
    )

def report_breakpoint_failed(id):
    send_debug_event(
        name='legacyBreakpointFailed',
        breakpointId=id,
    )

def report_breakpoint_hit(id, tid):
    send_debug_event(
        name='legacyBreakpointHit',
        breakpointId=id,
        threadId=tid,
    )

def report_process_loaded(tid):
    send_debug_event(
        name='legacyProcessLoad',
        threadId=tid,
    )

def report_execution_error(exc_text, execution_id):
    send_debug_event(
        name='legacyExecutionException',
        executionId=execution_id,
        exceptionText=exc_text,
    )

def report_execution_exception(execution_id, exc_info):
    try:
        exc_text = str(exc_info[1])
    except:
        exc_text = 'An exception was thrown'

    report_execution_error(exc_text, execution_id)

def safe_hex_repr(obj):
    try:
        return hex(obj)
    except:
        return None

def get_object_len(obj):
    try:
        return len(obj)
    except:
        return None

def report_execution_result(execution_id, result, repr_kind = PYTHON_EVALUATION_RESULT_REPR_KIND_NORMAL):
    if repr_kind == PYTHON_EVALUATION_RESULT_REPR_KIND_NORMAL:
        flags = 0
        obj_repr = safe_repr(result)
        obj_len = get_object_len(result)
        hex_repr = safe_hex_repr(result)
    else:
        flags = PYTHON_EVALUATION_RESULT_RAW
        hex_repr = None                
        for cls, raw_repr in TYPES_WITH_RAW_REPR.items():
            if isinstance(result, cls):
                try:
                    obj_repr = raw_repr(result)
                except:
                    obj_repr = None
                break
        obj_len = get_object_len(obj_repr)
        if repr_kind == PYTHON_EVALUATION_RESULT_REPR_KIND_RAWLEN:
            obj_repr = None

    res_type = type(result)
    type_name = type(result).__name__

    send_debug_event(
        name='legacyExecutionResult',
        executionId=execution_id,
        obj=create_object(res_type, obj_repr, hex_repr, type_name, obj_len, flags),
    )

def report_children(execution_id, children):
    children = [(name, expression, flags, safe_repr(result), safe_hex_repr(result), type(result), type(result).__name__, get_object_len(result)) for name, expression, result, flags in children]
    send_debug_event(
        name='legacyEnumChildrenResult',
        executionId=execution_id,
        children=[{
            'name': name,
            'expression': expression,
            'obj': create_object(res_type, obj_repr, hex_repr, type_name, obj_len, flags),
        } for name, expression, flags, obj_repr, hex_repr, res_type, type_name, obj_len in children],
    )

def get_code_filename(code):
    return path.abspath(code.co_filename)

def compile_eval_or_exec(text):
    try:
        code = compile(text, '<debug input>', 'eval')
    except:
        code = compile(text, '<debug input>', 'exec')
    return code

NONEXPANDABLE_TYPES = [int, str, bool, float, object, type(None), unicode]
try:
    NONEXPANDABLE_TYPES.append(long)
except NameError: pass

def create_object(obj_type, obj_repr, hex_repr, type_name, obj_len, flags = 0):
    if obj_type not in NONEXPANDABLE_TYPES and obj_len != 0:
        flags |= PYTHON_EVALUATION_RESULT_EXPANDABLE
    try:
        for cls in TYPES_WITH_RAW_REPR:
            if issubclass(obj_type, cls):
                flags |= PYTHON_EVALUATION_RESULT_HAS_RAW_REPR
                break
    except: # guard against broken issubclass for types which aren't actually types, like vtkclass
        pass

    obj = {
        'objRepr': obj_repr,
        'hexRepr': hex_repr,
        'typeName': '' if obj_type is SynthesizedValue else type_name,
        'length': obj_len or 0,
        'flags': flags,
    }

    return obj

debugger_thread_id = -1
_INTERCEPTING_FOR_ATTACH = False

def intercept_threads(for_attach = False):
    thread.start_new_thread = thread_creator
    thread.start_new = thread_creator

    # If threading has already been imported (i.e. we're attaching), we must hot-patch threading._start_new_thread
    # so that new threads started using it will be intercepted by our code.
    #
    # On the other hand, if threading has not been imported, we must not import it ourselves, because it will then
    # treat the current thread as the main thread, which is incorrect when attaching because this code is executing
    # on an ephemeral debugger attach thread that will go away shortly. We don't need to hot-patch it in that case
    # anyway, because it will pick up the new thread.start_new_thread that we have set above when it's imported.
    global _threading
    if _threading is None and 'threading' in sys.modules:
        import threading
        _threading = threading
        _threading._start_new_thread = thread_creator

    global _INTERCEPTING_FOR_ATTACH
    _INTERCEPTING_FOR_ATTACH = for_attach


def start_debugger_loop(sock):
    global debugger_thread_id
    debugger_thread_id = _start_new_thread(DebuggerLoop(sock).loop, ())

def attach_process(port_num, debug_id, debug_options, report = False, block = False):
    for i in xrange(50):
        failure_cause = ''
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect(('127.0.0.1', port_num))
            break
        except Exception:
            import traceback
            failure_cause = traceback.format_exc()
            import time
            time.sleep(50./1000)
    else:
        raise Exception('Attach failed:\n\n' + failure_cause)

    start_debugger_loop(sock)

    send_debug_event(
        name='legacyLocalConnected',
        processGuid=debug_id,
        result=0, # success
    )

    attach_connected_process(debug_options, report, block)

def attach_process_from_socket(sock, debug_options, report = False, block = False):
    start_debugger_loop(sock)
    attach_connected_process(debug_options, report, block)

def attach_connected_process(debug_options, report = False, block = False):
    global attach_sent_break, DETACHED, DEBUG_STDLIB, BREAK_ON_SYSTEMEXIT_ZERO, DJANGO_DEBUG

    BREAK_ON_SYSTEMEXIT_ZERO = 'BreakOnSystemExitZero' in debug_options
    DJANGO_DEBUG = 'DjangoDebugging' in debug_options

    if '' in PREFIXES:
        # If one or more of the prefixes are empty, we can't reliably distinguish stdlib
        # from user code, so override stdlib-only mode and allow to debug everything.
        DEBUG_STDLIB = True
    else:
        DEBUG_STDLIB = 'DebugStdLib' in debug_options

    wait_on_normal_exit = 'WaitOnNormalExit' in debug_options
    wait_on_abnormal_exit = 'WaitOnAbnormalExit' in debug_options

    def _excepthook(exc_type, exc_value, exc_tb):
        # Display the exception and wait on exit
        if exc_type is SystemExit:
            if (wait_on_abnormal_exit and exc_value.code) or (wait_on_normal_exit and not exc_value.code):
                print_exception(exc_type, exc_value, exc_tb)
                do_wait()
        else:
            print_exception(exc_type, exc_value, exc_tb)
            if wait_on_abnormal_exit:
                do_wait()
    sys.excepthook = sys.__excepthook__ = _excepthook

    attach_sent_break = False

    for mod_name, mod_value in sys.modules.items():
        try:
            filename = getattr(mod_value, '__file__', None)
            if filename is not None:
                try:
                    fullpath = path.abspath(filename)
                except:
                    pass
                else:
                    MODULES.append((filename, Module(mod_name, fullpath)))
        except:
            traceback.print_exc()   

    if report:
        THREADS_LOCK.acquire()
        try:
            all_threads = list(THREADS.values())
            if block:
                main_thread = THREADS[thread.get_ident()]
        finally:
            THREADS_LOCK.release()

        for cur_thread in all_threads:
            report_new_thread(cur_thread)
        for filename, module in MODULES:
            report_module_load(module)
    DETACHED = False

    if block:
        main_thread.block(lambda: report_process_loaded(thread.get_ident()))

    # intercept all new thread requests
    if not _INTERCEPTING_FOR_ATTACH:
        intercept_threads()

    if 'RedirectOutput' in debug_options:
        enable_output_redirection()

    send_debug_event(name='legacyModulesChanged')

# Try to detach cooperatively, notifying the debugger as we do so.
def detach_process_and_notify_debugger():
    if DebuggerLoop.instance:
        try:
            DebuggerLoop.instance.detach()
        except DebuggerExitException: # successfully detached
            return
        except: # swallow anything else, and forcibly detach below
            pass
    detach_process()

def detach_process():
    global DETACHED
    DETACHED = True
    if not _INTERCEPTING_FOR_ATTACH:
        if isinstance(sys.stdout, _DebuggerOutput): 
            sys.stdout = sys.stdout.old_out
        if isinstance(sys.stderr, _DebuggerOutput):
            sys.stderr = sys.stderr.old_out

    if not _INTERCEPTING_FOR_ATTACH:
        thread.start_new_thread = _start_new_thread
        thread.start_new = _start_new_thread

def detach_threads():
    # tell all threads to stop tracing...
    THREADS_LOCK.acquire()
    try:
        all_threads = list(THREADS.items())
    finally:
        THREADS_LOCK.release()

    for tid, pyThread in all_threads:
        if not _INTERCEPTING_FOR_ATTACH:
            pyThread.detach = True
            pyThread.stepping = STEPPING_BREAK

        if pyThread._is_blocked:
            pyThread.unblock()

    if not _INTERCEPTING_FOR_ATTACH:
        THREADS_LOCK.acquire()
        try:
            THREADS.clear()
        finally:
            THREADS_LOCK.release()
        
    BREAKPOINTS.clear()

def new_thread(tid = None, set_break = False, frame = None):
    # called during attach w/ a thread ID provided.
    if tid == debugger_thread_id:
        return None

    cur_thread = Thread(tid)
    THREADS_LOCK.acquire()
    try:
        THREADS[cur_thread.id] = cur_thread
    finally:
        THREADS_LOCK.release()

    cur_thread.push_frame(frame)
    if set_break:
        cur_thread.stepping = STEPPING_ATTACH_BREAK
    if not DETACHED:
        report_new_thread(cur_thread)
    return cur_thread

def new_external_thread():
    thread = new_thread()
    if not attach_sent_break:
        # we are still doing the attach, make this thread break.
        thread.stepping = STEPPING_ATTACH_BREAK
    elif SEND_BREAK_COMPLETE:
        # user requested break all, make this thread break
        thread.stepping = STEPPING_BREAK

    sys.settrace(thread.trace_func)

def do_wait():
    if sys.__stdout__ is not None:
        try:
            import msvcrt
        except ImportError:
            sys.__stdout__.write('Press Enter to continue . . . ')
            sys.__stdout__.flush()
            sys.__stdin__.read(1)
        else:
            sys.__stdout__.write('Press any key to continue . . . ')
            sys.__stdout__.flush()
            msvcrt.getch()

def enable_output_redirection():
    sys.stdout = _DebuggerOutput(sys.stdout, 'stdout')
    sys.stderr = _DebuggerOutput(sys.stderr, 'stderr')

class _DebuggerOutput(object):
    """file like object which redirects output to the debugger."""
    errors = 'strict'

    # Channel is one of: 'debug', 'stdout', 'stderr'
    def __init__(self, old_out, channel):
        self.channel = channel
        self.old_out = old_out
        if sys.version >= '3.' and hasattr(old_out, 'buffer'):
            self.buffer = DebuggerBuffer(old_out.buffer)

    def flush(self):
        if self.old_out:
            self.old_out.flush()
    
    def writelines(self, lines):
        for line in lines:
            self.write(line)
    
    @property
    def encoding(self):
        return 'utf8'

    def write(self, value):
        if not DETACHED:
            probe_stack(3)
            send_debug_event(
                name='legacyDebuggerOutput',
                threadId=thread.get_ident(),
                output=value,
                channel=self.channel,
            )
        if self.old_out:
            self.old_out.write(value)
    
    def isatty(self):
        return True

    def next(self):
        pass
    
    @property
    def name(self):
        return '<' + self.channel + '>'

    def __getattr__(self, name):
        return getattr(self.old_out, name)

class DebuggerBuffer(object):
    def __init__(self, old_buffer):
        self.buffer = old_buffer

    def write(self, data):
        if not DETACHED:
            probe_stack(3)
            str_data = utf_8.decode(data)[0]
            send_debug_event(
                name='legacyDebuggerOutput',
                threadId=thread.get_ident(),
                output=str_data,
            )
        self.buffer.write(data)

    def flush(self): 
        self.buffer.flush()

    def truncate(self, pos = None):
        return self.buffer.truncate(pos)

    def tell(self):
        return self.buffer.tell()

    def seek(self, pos, whence = 0):
        return self.buffer.seek(pos, whence)

debug_output = _DebuggerOutput(None, 'debug')

def is_same_py_file(file1, file2):
    """compares 2 filenames accounting for .pyc files"""
    if file1.endswith('.pyc') or file1.endswith('.pyo'): 
        file1 = file1[:-1]
    if file2.endswith('.pyc') or file2.endswith('.pyo'): 
        file2 = file2[:-1]

    return file1 == file2

def print_exception(exc_type, exc_value, exc_tb):
    # remove debugger frames from the top and bottom of the traceback
    tb = traceback.extract_tb(exc_tb)
    for i in [0, -1]:
        while tb:
            frame_file = path.normcase(tb[i][0])
            if not is_dont_debug(frame_file):
                break
            del tb[i]

    # print the traceback
    if tb:
        print('Traceback (most recent call last):')
        for out in traceback.format_list(tb):
            sys.stderr.write(out)
    
    # print the exception
    for out in traceback.format_exception_only(exc_type, exc_value):
        sys.stdout.write(out)

def parse_debug_options(s):
    return set([opt.strip() for opt in s.split(',')])

def debug(file, port_num, debug_id, debug_options, run_as = 'script'):
    wait_on_normal_exit = 'WaitOnNormalExit' in debug_options

    attach_process(port_num, debug_id, debug_options, report = True)

    # setup the current thread
    cur_thread = new_thread()
    cur_thread.stepping = STEPPING_LAUNCH_BREAK

    # start tracing on this thread
    sys.settrace(cur_thread.trace_func)

    # now execute main file
    globals_obj = {'__name__': '__main__'}
    try:
        if run_as == 'module':
            exec_module(file, globals_obj)
        elif run_as == 'code':
            exec_code(file, '<string>', globals_obj)
        else:
            exec_file(file, globals_obj)
    finally:
        sys.settrace(None)
        THREADS_LOCK.acquire()
        try:
            del THREADS[cur_thread.id]
        finally:
            THREADS_LOCK.release()
        report_thread_exit(cur_thread)

        # Give VS debugger a chance to process commands
        # by waiting for ack of "last" command
        global _threading
        if _threading is None:
            import threading
            _threading = threading
        global last_ack_event
        last_ack_event = _threading.Event()
        send_debug_event(name='legacyLast')
        last_ack_event.wait(5)

    if wait_on_normal_exit:
        do_wait()

# Code objects for functions which are going to be at the bottom of the stack, right below the first
# stack frame for user code. When we walk the stack to determine whether to report or block on a given
# frame, hitting any of these means that we walked all the frames that we needed to look at.
DEBUG_ENTRYPOINTS = set((
    get_code(debug),
    get_code(exec_file),
    get_code(exec_module),
    get_code(exec_code),
    get_code(new_thread_wrapper)
))
