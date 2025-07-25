# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

#[=======================================================================[.rst:
CheckFortranSourceCompiles
--------------------------

.. versionadded:: 3.1

Check once if Fortran source code can be built.

.. command:: check_fortran_source_compiles

  .. code-block:: cmake

    check_fortran_source_compiles(<code> <resultVar>
        [FAIL_REGEX <regex>...]
        [SRC_EXT <extension>]
    )

  Check once that the source supplied in ``<code>`` can be built. The result is
  stored in the internal cache variable specified by ``<resultVar>``, with
  boolean ``true`` for success and boolean ``false`` for failure.

  If ``FAIL_REGEX`` is provided, then failure is determined by checking
  if anything in the compiler output matches any of the specified regular
  expressions.

  By default, the test source file will be given a ``.F`` file extension. The
  ``SRC_EXT`` option can be used to override this with ``.<extension>`` instead--
  ``.F90`` is a typical choice.

  See also :command:`check_source_compiles` for a more general command syntax.

  See also :command:`check_source_runs` to run compiled source.

  Internally, :command:`try_compile` is used to compile the source. If
  :variable:`CMAKE_TRY_COMPILE_TARGET_TYPE` is set to ``EXECUTABLE`` (default),
  the source is compiled and linked as an executable program. If set to
  ``STATIC_LIBRARY``, the source is compiled but not linked. In any case, all
  functions must be declared as usual.

  The compile and link commands can be influenced by setting any of the
  following variables prior to calling ``check_fortran_source_compiles()``:

.. include:: /module/CMAKE_REQUIRED_FLAGS.txt

.. include:: /module/CMAKE_REQUIRED_DEFINITIONS.txt

.. include:: /module/CMAKE_REQUIRED_INCLUDES.txt

.. include:: /module/CMAKE_REQUIRED_LINK_OPTIONS.txt

.. include:: /module/CMAKE_REQUIRED_LIBRARIES.txt

.. include:: /module/CMAKE_REQUIRED_LINK_DIRECTORIES.txt

.. include:: /module/CMAKE_REQUIRED_QUIET.txt

#]=======================================================================]

include_guard(GLOBAL)
include(Internal/CheckSourceCompiles)

macro(CHECK_Fortran_SOURCE_COMPILES SOURCE VAR)
  # Pass the SRC_EXT we used by default historically.
  # A user-provided SRC_EXT argument in ARGN will override ours.
  cmake_check_source_compiles(Fortran "${SOURCE}" ${VAR} SRC_EXT "F" ${ARGN})
endmacro()
