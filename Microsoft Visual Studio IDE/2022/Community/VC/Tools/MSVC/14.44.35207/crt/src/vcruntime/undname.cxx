//	Make sure all dependent defines exist and have a valid value

#if defined _CRTBLD && !defined _VCRT_BUILD
#define _VCRT_BUILD
#endif

#ifndef PACK_SIZE
#ifdef _VCRT_BUILD
#define PACK_SIZE 8
#elif defined(_X86_)
#define PACK_SIZE 4
#else
#define PACK_SIZE 8
#endif
#endif

//	Check for version inconsistencies, and setup version flags

#pragma inline_depth(3)
#pragma check_stack(off)


#define PURE = 0

// Allow decoding C++/CLI names
#ifndef CC_COR
#define CC_COR 1
#endif

// Allow decoding C++/AMP names
#ifndef CC_RESTRICTION_SPEC
#define CC_RESTRICTION_SPEC 1
#endif

#ifndef CC_DP_CXX
#define CC_DP_CXX 1
#endif

#include "undname.hxx"

#if !defined(DASSERT)
#if !defined(_VCRT_BUILD) && defined(_DEBUG)
#include <assert.h>
#define DASSERT(x) assert(x)
#else
#define DASSERT(x)
#endif
#else
// This is an FE build; DASSERT is defined properly
#endif

#include <stdio.h>
#ifdef _VCRT_BUILD
#include <vcruntime_internal.h>
#include <vcruntime_string.h>
#include <stdlib.h>
#endif

#include <string.h>

#ifndef _countof
#define _countof(_Array) (sizeof(_Array) / sizeof(_Array[0]))
#endif

#pragma warning(push)
#pragma warning(disable:4668)
#include <Windows.h>
#pragma warning(pop)
#include "utf8.h"

#include <optional>

#pragma warning(disable:4291)	// No matching operator delete

static unsigned int und_strlen(pcchar_t);
static void und_memcpy(_Out_bytecap_(len) pchar_t dst, pcchar_t src, unsigned int len);
static unsigned int und_strncmp(pcchar_t, pcchar_t, unsigned int);

static char distance(char c1, char c2)
{
	return c1 - c2;
}

class DName;
class DNameNode;
class Replicator;
class _HeapManager;
class UnDecorator;

#define UNDNAME_ELLIPSIS_ALTERNATE_STRINGLITERAL_1 "<ellipsis>"_l
#define UNDNAME_ELLIPSIS_ALTERNATE_STRINGLITERAL_2 ",<ellipsis>"_l

// A 4K byte block, not including the header.  That matches LIMIT_ID_LENGTH
// in the frontend.
const   unsigned int    memBlockSize = 4096;

// Dev10 bug 662979
// undname will be pulled into libcmt.lib. Prefix with underscore to prevent potential conflict with user code.
class _HeapManager
{
private:
	Alloc_t pOpNew;
	Free_t pOpDelete;

	struct Block
	{
		Block *		next;
		char memBlock[memBlockSize];

		[[gsl::suppress(26495)]]
		Block() { next = 0; }

	};

	Block *			head;
	Block *			tail;
	size_t blockLeft;

public:
	_HeapManager(Alloc_t pAlloc, Free_t pFree)
	{
		pOpNew = pAlloc;
		pOpDelete = pFree;
		blockLeft = 0;
		head = 0;
		tail = 0;
	}

	// Avoid unintentional copy
	
	_HeapManager(const _HeapManager&) = delete;
	_HeapManager& operator=(const _HeapManager&) = delete;

	void *getMemoryWithoutBuffer(size_t sz);
	void *getMemoryWithBuffer(size_t sz);

	// Can't use Language-Level destructor with SEH
	void Destructor()
	{
		if (pOpDelete != nullptr)
			while ((tail = head) != nullptr)
			{
				head = tail->next;
				(*pOpDelete)(tail);
			}
	}

#define gnew new(heap,0)
#define rnew new(heap,1)
#define gnew2 new(undecorator->getHeap(),0)
#define rnew2 new(undecorator->getHeap(),1)

};



void   *	operator new (size_t, _HeapManager &, int = 0);

// This class is used to wrap a string literal which is available in the whole program
// DName can directly reference a string literal without potential lifetime issue
struct StringLiteral
{
	const char* str;
	int len;

	StringLiteral operator+(int offset) const
	{
		return { str + offset, len - offset };
	}
};

constexpr StringLiteral operator""_l(const char* str, size_t len)
{
	return { str, static_cast<int>(len) };
}

//	The MS Token table

enum Tokens
{
	TOK_basedLp,
	TOK_cdecl,
	TOK_stdcall,
	TOK_thiscall,
	TOK_fastcall,
	TOK_vectorcall,
	TOK_preserve_none,
	TOK_cocall,
	TOK_eabi,
	TOK_swift_1,
	TOK_swift_2,
	TOK_swift_3,
	TOK_ptr64,
	TOK_restrict,
	TOK_unaligned,
#if CC_RESTRICTION_SPEC
	TOK_restrictSpecLp,
#endif // CC_RESTRICTION_SPEC
	TOK__last
};


static constexpr StringLiteral tokenTable[] =
{
	"__based("_l,		// TOK_basedLp
	"__cdecl"_l,		// TOK_cdecl
	"__stdcall"_l,	// TOK_stdcall
	"__thiscall"_l,	// TOK_thiscall
	"__fastcall"_l,	// TOK_fastcall
	"__vectorcall"_l,	// TOK_vectorcall
	"__preserve_none"_l,	// TOK_preserve_none
	"__clrcall"_l,	// TOK_cocall
	"__eabi"_l,		// TOK_eabi
	"__swift_1"_l,	// TOK_swift_1
	"__swift_2"_l,	// TOK_swift_2
	"__swift_3"_l,	// TOK_swift_3
	"__ptr64"_l,		// TOK_ptr64
	"__restrict"_l,	// TOK_restrict
	"__unaligned"_l,	// TOK_unaligned
#if CC_RESTRICTION_SPEC
	"restrict("_l,		// TOK_restrict_spec
#endif // CC_RESTRICTION_SPEC
	""_l
};


//	The operator mapping table

static constexpr StringLiteral nameTable[] =
{
	" new"_l,
	" delete"_l,
	"="_l,
	">>"_l,
	"<<"_l,
	"!"_l,
	"=="_l,
	"!="_l,
	"[]"_l,
	"operator"_l,
	"->"_l,
	"*"_l,
	"++"_l,
	"--"_l,
	"-"_l,
	"+"_l,
	"&"_l,
	"->*"_l,
	"/"_l,
	"%"_l,
	"<"_l,
	"<="_l,
	">"_l,
	">="_l,
	","_l,
	"()"_l,
	"~"_l,
	"^"_l,
	"|"_l,
	"&&"_l,
	"||"_l,
	"*="_l,
	"+="_l,
	"-="_l,
	"/="_l,
	"%="_l,
	">>="_l,
	"<<="_l,
	"&="_l,
	"|="_l,
	"^="_l,

	"`vftable'"_l,
	"`vbtable'"_l,
	"`vcall'"_l,
	"`typeof'"_l,
	"`local static guard'"_l,
	"`string'"_l,
	"`vbase destructor'"_l,
	"`vector deleting destructor'"_l,
	"`default constructor closure'"_l,
	"`scalar deleting destructor'"_l,
	"`vector constructor iterator'"_l,
	"`vector destructor iterator'"_l,
	"`vector vbase constructor iterator'"_l,
	"`virtual displacement map'"_l,
	"`eh vector constructor iterator'"_l,
	"`eh vector destructor iterator'"_l,
	"`eh vector vbase constructor iterator'"_l,
	"`copy constructor closure'"_l,
	"`udt returning'"_l,
	"`EH"_l, //eh initialized struct
	"`RTTI"_l, //rtti initialized struct
	"`local vftable'"_l,
	"`local vftable constructor closure'"_l,

	" new[]"_l,
	" delete[]"_l,

	"`omni callsig'"_l,
	"`placement delete closure'"_l,
	"`placement delete[] closure'"_l,
	"`managed vector constructor iterator'"_l,
	"`managed vector destructor iterator'"_l,
	"`eh vector copy constructor iterator'"_l,
	"`eh vector vbase copy constructor iterator'"_l,
	"`dynamic initializer for '"_l,
	"`dynamic atexit destructor for '"_l,
	"`vector copy constructor iterator'"_l,
	"`vector vbase copy constructor iterator'"_l,
	"`managed vector copy constructor iterator'"_l,
	"`local static thread guard'"_l,

	"operator \"\" "_l,
	"operator co_await"_l,
	"operator<=>"_l,
	""_l
};

static constexpr StringLiteral rttiTable[] =
{
	" Type Descriptor'"_l,
	" Base Class Descriptor at ("_l,
	" Base Class Array'"_l,
	" Class Hierarchy Descriptor'"_l,
	" Complete Object Locator'"_l,
};


//  ------------------------------------------------------------------------
//
//  DName
//
//  A DName is the result of undecorating part of a decorated name.  It has
//  three main parts: a string, a status, and some flags that are used to
//  communicate what kind of thing the string represents.  The bulk of the work
//  of the undecorator is scanning the input and building the output string.
//  DName supports a wide variety of string operations via overloaded operators
//  to make the main algorithm as plain as possible.
//
//  A DName can contain embedded DNames.  This is used to generate a declarator
//  like "void #()" (where # is the embedded DName) and later set # to "__cdecl
//  foo" to build the full string "void __cdecl foo()".
//
//  Once a the DName::length method has been called, you should no longer
//  assign to or append to any of the embedded DNames.  The protocol is:
//
//    1. Build the DName
//    2. Get the length
//    3. Get the text using getString(pchar_t, int);
//


//	The following 'enum' should really be nested inside 'class DName', but to
//	make the code compile better with Glockenspiel, I have extracted it

enum DNameStatus
{
	DN_valid,		// good result
	DN_truncated,	// ran out of input string or subcomponent
	DN_invalid,		// unusable input, not a valid decorated name
	DN_error // internal error
};

enum class StringLife
{
	Unknown, // the lifetime is unknown
	Persistent, // the string has longer lifetime than the undecorator
	Temporary // the string has shorter lifetime than the undecorator
};

// This class is used to dispatch based on 'StringLife' for constructor
template<StringLife life>
struct StringLifeSelector {};

class DName
{
public:
	explicit DName(UnDecorator *);
	DName(const DName &);		// Shallow copy

	explicit DName(UnDecorator *, char);
	explicit DName(UnDecorator *, const StringLiteral& s);
	template<StringLife life>
	explicit DName(UnDecorator *, pcchar_t, StringLifeSelector<life>);
	explicit DName(UnDecorator *, pcchar_t&, char);
	explicit DName(UnDecorator *, DNameStatus);
	explicit DName(UnDecorator *, DName *);
	explicit DName(UnDecorator *, unsigned __int64);
	explicit DName(UnDecorator *, __int64);

	int isValid() const;
	int isEmpty() const;
	DNameStatus status() const;
	void clearStatus();

	DName& setPtrRef();
	int isPtrRef() const;
	int isUDC() const;
	void setIsUDC();
	int isUDTThunk() const;
	void setIsUDTThunk();
	int isArray() const;
	void setIsArray();
	int isNoTE() const;
	void setIsNoTE();
	int isPinPtr() const;
	void setIsPinPtr();
	int isComArray() const;
	void setIsComArray();
	int isVCallThunk() const;
	void setIsVCallThunk();

	int length() const;

	// Returns the last character, or '\0' if the DName represents an empty
	// string.
	char getLastChar() const;

	// Top level getString. Allocates a buffer if none provided.
	// NUL-terminates the buffer.
	pchar_t getString(_Inout_z_cap_(max) pchar_t buf, int max) const;

	// Internal getString fills in characters at 'buf' and returns a
	// pointer to the position of the next character in buf. 'end' points
	// after the last character in the buffer.
	pchar_t getString(_In_z_ pchar_t buf, _In_ pchar_t end) const;

	DName operator + (const StringLiteral& s) const;
	DName operator + (const DName &) const;
	DName operator + (char) const;
	DName operator + (DName *) const;
	DName operator + (DNameStatus) const;

	DName & operator += (char);
	DName& operator += (const StringLiteral& s);
	DName & operator += (DName *);
	DName & operator += (DNameStatus);
	DName & operator += (const DName &);

	DName & operator |= (const DName &);

	DName & operator = (const StringLiteral& s);
	DName & operator = (const DName &);
	DName & operator = (char);
	DName & operator = (DName *);
	DName & operator = (DNameStatus);

	//	Friends :

	friend DName operator + (const StringLiteral& s, const DName&);
	friend DName operator + (char, const DName &);
	friend DName operator + (DNameStatus, const DName &);

private:
	const DNameNode * node;
    UnDecorator *const undecorator;

	union
	{
		unsigned int value;
#pragma warning(push)
#pragma warning(disable: 4201) // nonstandard extension used: nameless struct/union
		struct
		{
			DNameStatus stat : 8;
			unsigned int isIndir : 1;
			unsigned int isAUDC : 1;
			unsigned int isAUDTThunk : 1;
			unsigned int isArrayType : 1;
			unsigned int NoTE : 1;
			unsigned int pinPtr : 1;
			unsigned int comArray : 1;
			unsigned int vcallThunk : 1;
		};
#pragma warning(pop)
	};

	template<typename T>
	void append(const T *newRight);
	void doPchar(char);
	template<StringLife life>
	void doPchar(pcchar_t, int);
};



class Replicator
{
private:

	// Prevent unintentional copies
	Replicator(const Replicator &) = delete;
	void operator = (const Replicator&) = delete;

	int index;
	DName *	dNameBuffer[10]{};
	UnDecorator *const undecorator;

public:
	explicit Replicator(UnDecorator*);

	int isFull() const;

	Replicator &	operator += (const DName &);
	DName operator [] (int) const;

};


enum class IndirectionKind
{
	None,
	Pointer, // *
	LvalueReference, // &
	RvalueReference, // &&
	Handle, // ^
	Percent, // %
};

static constexpr StringLiteral IndirectionName[] = {
	""_l,
	"*"_l,
	"&"_l,
	"&&"_l,
	"^"_l,
	"%"_l
};

enum class PrefixKind
{
	StringLiteral, // prefix for string literal
	AnonymousNamespace // prefix for anonymous namespace
};

static constexpr StringLiteral PrefixName[] = {
	"`string'"_l,
	"`anonymous namespace'"_l,
};

class UnDecorator
{
private:
	//	Declare, in order to suppress automatic generation
	void operator = (const UnDecorator&) = delete;
	UnDecorator(const UnDecorator&) = delete;

	Replicator ArgList;
	Replicator *pArgList;

	Replicator ZNameList;
	Replicator *pZNameList;

	Replicator *pTemplateArgList{};

	_HeapManager heap;

	pcchar_t gName{};
	pcchar_t name{};
	unsigned long disableFlags{};
	bool fExplicitTemplateParams{};
	bool fGetTemplateArgumentList{};

	GetParameter_t m_pGetParameter{};
	unsigned long m_CHPENameOffset{};
	unsigned long m_recursionLevel{};

	// Increment the internal buffer 'gName' by 'count' characters.
	// If it passes the terminating null, return false. Otherwise, return true.
	[[nodiscard]] bool increment_buffer(size_t count)
	{
		DASSERT(count > 0);

		for (size_t i = 0; i < count; ++i)
		{
			if (*gName == 0)
			{
				return false;
			}

			++gName;
		}

		return true;
	}

	// Increment the internal buffer 'gName' by 'count' characters.
	// The caller ensures that it won't pass the terminating null.
	void increment_buffer_no_check(size_t count)
	{
		DASSERT(count > 0);

		for (size_t i = 0; i < count; ++i)
		{
			DASSERT(gName[i] != 0);
		}

		gName += count;
	}

	// Increment the internal buffer 'gName' by one character.
	// The caller ensures that it won't pass the terminating null.
	void increment_buffer_no_check()
	{
		DASSERT(*gName != 0);
		++gName;
	}

	// Get the current character pointed by the internal buffer 'gName'.
	// If the current character isn't the terminating null, increment the buffer
	// by one character.
	[[nodiscard]] char get_current_character_and_increment_buffer()
	{
		char c = *gName;
		if (c) ++gName;
		return c;
	}

	DName getDecoratedName(void);
	DName getSymbolName(void);
	DName getZName(bool fUpdateCachedNames, bool fAllowEmptyName = false);
	DName getOperatorName(bool fIsTemplate, bool *pfReadTemplateArguments);
	DName getScope(void);
	DName getScopedName(void);
	std::optional<std::uint64_t> getValue();
	DName getSignedDimension(void);
	DName getDimension(bool is_signed = false);
	DName getFloatingPoint(int type_category);
	DName getValueObject();
	DName getArrayObject();
	DName getStringObject();
	DName getAddressOf();
	DName getMemberAccess();
	DName getArrayAccess();
	DName getUnionObject();
	DName getPointerToMember();
	int getNumberOfDimensions(void);
	DName getTemplateName(bool);
	DName getTemplateArgumentList(void);
	DName getTemplateNonTypeArgument(void);
	DName getTemplateTypeArgument(void);
	DName composeDeclaration(const DName &);
	int getTypeEncoding(void);
	DName getBasedType(void);
	DName getECSUName(void);
	DName getEnumType(void);
	DName getCallingConvention(void);
	DName getReturnType(DName * = 0);
	DName getDataType(DName *);
	DName getPrimaryDataType(const DName &);
	DName getDataIndirectType(const DName &, IndirectionKind kind, const DName &, int = FALSE);
	DName getExtendedDataIndirectType(IndirectionKind& kind, bool& fIsPinPtr, int thisFlag);
	DName getDataIndirectType();
	DName getBasicDataType(const DName &);
	DName getECSUDataType(void);
	DName getPtrRefType(const DName &, const DName &, IndirectionKind kind);
	DName getPtrRefDataType(const DName &, int);
	DName getArrayType(const DName&);
	DName getFunctionIndirectType(const DName & superType);
	DName getArgumentTypes(void);
	DName getArgumentList(void);
	DName getThrowTypes(void);
	DName getNoexcept();
#if CC_RESTRICTION_SPEC
	DName getRestrictionSpec(void);
	DName getDispatchTarget(void);
#endif // CC_RESTRICTION_SPEC
	DName getLexicalFrame(void);
	DName getStorageConvention(void);
	DName getThisType(void);
	DName getPointerType(const DName &, const DName &);
	DName getPointerTypeArray(const DName &, const DName &);
	DName getReferenceType(const DName &, const DName &, IndirectionKind kind);
	DName getExternalDataType(const DName &);
	DName getSegmentName(void);

	DName getDisplacement(void);
	DName getCallIndex(void);
	DName getGuardNumber(void);
	DName getVfTableType(const DName &);
	DName getVbTableType(const DName &);
	DName getVdispMapType(const DName &);
	DName getVCallThunkType(void);

	DName getStringEncoding(PrefixKind kind, int wantBody);
    DName parseDecoratedName(void);

public:

	UnDecorator(pcchar_t, GetParameter_t, unsigned long, Alloc_t pAlloc, Free_t pFree);
	void Destructor() { heap.Destructor(); }


	int doUnderScore();
	int doMSKeywords();
	int doPtr64();
	int doFunctionReturns();
	int doAllocationModel();
	int doAllocationLanguage();

	int doThisTypes();
	int doAccessSpecifiers();
	int doThrowTypes();
	int doMemberTypes();
	int doReturnUDTModel();

	int do32BitNear();

	int doNameOnly();
	int doTypeOnly();
	int haveTemplateParameters();
	int doEcsu();
	int doNoIdentCharCheck();
	int doEllipsis();
#if CC_RESTRICTION_SPEC
	int doRestrictionSpec();
#endif // CC_RESTRICTION_SPEC
	StringLiteral UScore(Tokens);

	_HeapManager &getHeap() { return heap; }

    _Success_(return != nullptr) pchar_t getUndecoratedName(_Out_opt_z_cap_(maxStringLength) pchar_t, int maxStringLength);
    _Success_(return != nullptr) pchar_t getCHPEName(_Out_opt_z_cap_(maxStringLength) pchar_t, int maxStringLength);
};

pchar_t __cdecl unDNameGenerateCHPE (
    _When_(pAlloc, _Out_writes_opt_z_(maxStringLength)) pchar_t outputString,
    pcchar_t name,
    int maxStringLength,
    Alloc_t pAlloc,
    Free_t pFree,
    unsigned long disableFlags
    )
{
    if (!(pAlloc))
        return 0;

    pchar_t chpeName = nullptr;

    UnDecorator unDecorate(name, nullptr, disableFlags, pAlloc, pFree);
    chpeName = unDecorate.getCHPEName(outputString, maxStringLength);
	unDecorate.Destructor();

    return chpeName;
}

pchar_t __UNDNAME_IMP __cdecl __UNDNAME_NAME(
    _Out_opt_z_cap_(maxStringLength) pchar_t outputString,
	pcchar_t name,
	int maxStringLength,	// Note, COMMA is leading following optional arguments
	Alloc_t pAlloc,
	Free_t pFree,
	unsigned short disableFlags

)
/*
 *	This function will undecorate a name, returning the string corresponding to
 *	the C++ declaration needed to produce the name.  Its has a similar interface
 *	to 'strncpy'.
 *
 *	If the target string 'outputString' is specified to be NULL, a string of
 *	suitable length will be allocated and its address returned.  If the returned
 *	string is allocated by 'unDName', then it is the programmers responsibility
 *	to deallocate it.  It will have been allocated on the far heap.
 *
 *	If the target string is not NULL, then the parameter 'maxStringLength' will
 *	specify the maximum number of characters which may be placed in the string.
 *	In this case, the returned value is the same as 'outputString'.
 *
 *	Both the input parameter 'name' and the returned string are NULL terminated
 *	strings of characters.
 *
 *	If the returned value is NULL, it indicates that the undecorator ran out of
 *	memory, or an internal error occurred, and was unable to complete its task.
 */

{
	return __UNDNAME_NAME_EX(outputString, name, maxStringLength, pAlloc, pFree,
                             nullptr, disableFlags);
}




pchar_t __UNDNAME_IMP __cdecl __UNDNAME_NAME_EX(
	_When_(pAlloc, _Out_writes_opt_z_(maxStringLength)) pchar_t outputString,
	pcchar_t name,
	int maxStringLength,	// Note, COMMA is leading following optional arguments
	Alloc_t pAlloc,
	Free_t pFree,
	GetParameter_t pGetParameter,
	unsigned long disableFlags

)
/*
 *	This function will undecorate a name, returning the string corresponding to
 *	the C++ declaration needed to produce the name.  Its has a similar interface
 *	to 'strncpy'.
 *
 *	If the target string 'outputString' is specified to be NULL, a string of
 *	suitable length will be allocated and its address returned.  If the returned
 *	string is allocated by 'unDName', then it is the programmers responsibility
 *	to deallocate it.  It will have been allocated on the far heap.
 *
 *	If the target string is not NULL, then the parameter 'maxStringLength' will
 *	specify the maximum number of characters which may be placed in the string.
 *	In this case, the returned value is the same as 'outputString'.
 *
 *	Both the input parameter 'name' and the returned string are NULL terminated
 *	strings of characters.
 *
 *	If the returned value is NULL, it indicates that the undecorator ran out of
 *	memory, or an internal error occurred, and was unable to complete its task.
 */

{
	//	Must have an allocator and a deallocator (and we MUST trust them)

	if (!(pAlloc))
		return nullptr;

	pchar_t unDecoratedName = nullptr;

#ifdef _VCRT_BUILD
	__vcrt_lock(__vcrt_undname_lock);
	__try
	{
#endif
        //	Create the undecorator object, and get the result

        UnDecorator unDecorate(name, pGetParameter, disableFlags, pAlloc, pFree);
        unDecoratedName = unDecorate.getUndecoratedName(outputString, maxStringLength);
		unDecorate.Destructor();
		
#ifdef _VCRT_BUILD
	}
	__finally
	{
		__vcrt_unlock(__vcrt_undname_lock);
	}
#endif


	//	And return the composed name

	return unDecoratedName;

}	// End of FUNCTION "unDName"

//	The 'UnDecorator' member functions

inline UnDecorator::UnDecorator(
	pcchar_t dName,
	GetParameter_t pGetParameter,
	unsigned long disable,
    Alloc_t pAlloc, 
	Free_t pFree
)
	: ArgList{this}, ZNameList{this}, heap {pAlloc, pFree}
{
	name = dName;
	gName = name;

	pZNameList = &ZNameList;
	pArgList = &ArgList;
	disableFlags = disable;
	m_pGetParameter = pGetParameter;
	fExplicitTemplateParams = false;
    m_CHPENameOffset = 0;
    m_recursionLevel = 0;

}	// End of "UnDecorator" CONSTRUCTOR '()'

DName UnDecorator::parseDecoratedName(void)
{
    DASSERT(name == gName);

    DName result(this);

    //	Find out if the name is a decorated name or not.  Could be a reserved
    //	CodeView variant of a decorated name

    if (name)
    {
        if ((*name == '?') && (name[1] == '@'))
        {
            gName = name + 2;
            result = "CV: "_l + getDecoratedName();
        }	// End of IF then
        else if ((*name == '?') && (name[1] == '$'))
        {
            result = getTemplateName(false);

            if ((result.status() == DN_invalid) || (!doNameOnly() && *gName))
            {
                //
                // What harm could there be to try again ?
                //	Repro:
                //		?$S1@?1??VTFromRegType@CRegParser@ATL@@KAHPBGAAG@Z@4IA
                //	---> unsigned int `protected: static int __cdecl ATL::CRegParser::VTFromRegType(unsigned short const *,unsigned short &)'::`2'::$S1
                //
                //	This is a compiler generated symbol for a local static array init.
                //
                gName = name;
                result = getDecoratedName();
            }
        }
        else if ((name[0] == '?') && (name[1] == '?') && (name[2] == '@'))
        {
            // A name that starts with "??@" is a truncated decorated name so do not attempt to undecorate it
            result = DN_invalid;
        }
        else
        {
            result = getDecoratedName();
        }
    }

    return result;
}

_Success_(return != nullptr)
inline pchar_t UnDecorator::getUndecoratedName (
    _Out_opt_z_cap_(maxStringLength) pchar_t outputString,
    int maxStringLength
    )
{
	DName unDName(this);
    DName result = parseDecoratedName();

	//	If the name was not a valid name, then make the name the same as the original
	//	It is also invalid if there are any remaining characters in the name (except when
	//	we're giving the name only)

	if (result.status() == DN_error)
		return nullptr;
	else if((result.status() == DN_invalid) || (!doNameOnly() && *gName))
		unDName = DName(this, name, StringLifeSelector<StringLife::Persistent>{});	// Return the original name
	else
		unDName = result;

	//	Construct the return string

	if (!outputString)
	{
		maxStringLength = unDName.length() + 1;
		outputString = rnew char[maxStringLength];

	}	// End of IF

	if (outputString)
	{
		unDName.getString(outputString, maxStringLength);

		// strip extra whitespace out of name
		pchar_t pRead = outputString;
		pchar_t pWrite = pRead;
		while (*pRead)
		{
			if (*pRead == ' ')
			{
				pRead++;
				*pWrite++ = ' ';
				while (*pRead == ' ')
				{
					pRead++;
				}
			}
			else
				*pWrite++ = *pRead++;
		}
		*pWrite = *pRead;
	}

	//	Return the result

	return outputString;

}	// End of "UnDecorator" getUndecoratedName

_Success_(return != nullptr)
inline pchar_t UnDecorator::getCHPEName(
    _Out_opt_z_cap_(maxStringLength) pchar_t outputString,
    int maxStringLength
    )
{
    DName result = parseDecoratedName();

    if (result.status() != DN_valid)
    {
        return nullptr;
    }

    if (m_CHPENameOffset == 0)
    {
        return nullptr;
    }

    // compute final string length
    size_t len = strlen(name);

    if (m_CHPENameOffset >= len)
    {
        DASSERT(FALSE && "Invalid CHPE name offset");
        return nullptr;
    }

    const char chpeMarker[] = "$$h";
    const size_t chpeMarkerSize = strlen(chpeMarker);

    // Check if the name is already a CHPE name.
    if (strncmp(name + m_CHPENameOffset, chpeMarker, chpeMarkerSize) == 0)
    {
        return nullptr;
    }

    size_t finalLen = len + chpeMarkerSize + sizeof('\0');
    if (finalLen < len)
    {
        return nullptr;
    }

    if (outputString)
    {
        if (finalLen >= (size_t)maxStringLength)
        {
            return nullptr;
        }
    }
    else
    {
        outputString = rnew char[finalLen];
        if (!outputString)
        {
            return nullptr;
        }
    }

    memcpy(outputString, name, m_CHPENameOffset);
    memcpy(outputString + m_CHPENameOffset, chpeMarker, chpeMarkerSize);
    memcpy(outputString + m_CHPENameOffset + chpeMarkerSize,
           name + m_CHPENameOffset,
           len - m_CHPENameOffset + sizeof('\0'));

    // memcpy is guaranteed to yield a null-terminated string here.
    _Analysis_assume_nullterminated_(outputString);

    return outputString;
}

DName UnDecorator::getDecoratedName(void)
{

    // Setup a C++ object that will count recursive invocations of this
    // function.
    struct TrackRecursion {
		unsigned long &r;
		TrackRecursion(unsigned long &recur)
			: r{recur}
		{
            r += 1;
        }
        ~TrackRecursion() {
            r -= 1;
        }
	} trackRecursion{m_recursionLevel};

	//	Ensure that it is intended to be a decorated name

	if (doTypeOnly())
	{
		// Disable the type-only flag, so that if we get here recursively, eg.
		// in a template tag, we do full name undecoration.
		disableFlags &= ~UNDNAME_TYPE_ONLY;

		// If we're decoding just a type, process it as the type for an abstract
		// declarator, by giving an empty symbol name.

		DName result = getDataType(NULL);
		disableFlags |= UNDNAME_TYPE_ONLY;

		return result;
	}
	else if(*gName == '?')
	{
		//	Extract the basic symbol name

		increment_buffer_no_check();	// Advance the original name pointer

		// What!?!? we have a name that starts with '???' how is this possible?
		// Easy: consider code like the following:
		//
		// int f();
		//
		// int g = f();
		//
		// This will cause the compiler to generate am extern "C" file-scope static
		// initialization function with the name '??__Eg@@YAXXZ'
		//
		// Now: let's say that we compile with file with /clr: as the CLR cannot handle
		// file scope statics the compiler makes them all look like members of an anonymous
		// namespace. So the compiler will try to decorate then name again even though we
		// have already marked it as extern "C". The new name it will generate will be:
		// '???__Eg@@YMXXZ@?A0x2109f7d3@@$$FYMXXZ'
		//
		// So how should we undecorate this? Well unless you want a really weird looking
		// name the best way is to forget about the encoding added because of the CLR as
		// just undecorate the original name.
		if ((gName[0] == '?') && (gName[1] == '?'))
		{
			// Skip the first '?' and restart the undecoration process.
			DName result = getDecoratedName();

			// We have undecorated the original name ... skip whatever else was added
			// to keep the CLR happy
			while (*gName != '\0')
			{
				increment_buffer_no_check();
			}

			return result;
		}

		DName symbolName = getSymbolName();
		int udcSeen = symbolName.isUDC();
		int vcallThunkSeen = symbolName.isVCallThunk();

		//	Abort if the symbol name is invalid

		if (!symbolName.isValid())
			return symbolName;

		//	Extract, and prefix the scope qualifiers

		if (*gName && (*gName != '@'))
		{
			DName scope = getScope();

			if (!scope.isEmpty())
				if (fExplicitTemplateParams)
				{
					fExplicitTemplateParams = false;
					symbolName = symbolName + scope;
					if (*gName != '@')
					{
						scope = getScope();
						symbolName = scope + "::"_l + symbolName;
					}
				}
				else
				{
					symbolName = scope + "::"_l + symbolName;
				}
		}

		if (udcSeen)
			symbolName.setIsUDC();

		if (vcallThunkSeen)
		{
			symbolName.setIsVCallThunk();
		}

		//	Now compose declaration

		if (symbolName.isEmpty() || symbolName.isNoTE())
		{
			return symbolName;
		}
		else if(!*gName || (*gName == '@'))
		{
			if (*gName)
				increment_buffer_no_check();

			if (doNameOnly() && !udcSeen && !symbolName.isVCallThunk())
			{
				// Eat the rest of the dname, in case this is a recursive invocation,
				// such as for a template argument.
				(void)composeDeclaration(DName(this));
				return symbolName;
			}
			else
			{
				return composeDeclaration(symbolName);
			}

		}	// End of else if then
		else
			return DName(this, DN_invalid);

	}	// End of IF then
	else if(*gName)
		return DName(this, DN_invalid);
	else
		return DName(this, DN_truncated);

}	// End of "UnDecorator" FUNCTION "getDecoratedName"



inline DName UnDecorator::getSymbolName()
{
	if (gName[0] == '?')
	{
		if (gName[1] == '$')
		{
			return getTemplateName(true);
		}
		else
		{
			increment_buffer_no_check();

			return getOperatorName(false, NULL);
		}
	}
	else
	{
		return getZName(true);
	}
}


DName UnDecorator::getZName(bool fUpdateCachedNames, bool fAllowEmptyName)
{
	int zNameIndex = *gName - '0';


	//	Handle 'zname-replicators', otherwise an actual name

	if ((zNameIndex >= 0) && (zNameIndex <= 9))
	{
		increment_buffer_no_check();	// Skip past the replicator

		//	And return the indexed name

		return (*pZNameList)[zNameIndex];

	}	// End of IF then
	else
	{
		DName zName(this);

		if (*gName == '?')
		{
			zName = getTemplateName(false);

			char c = *gName;
			if (c == '@')
			{
				increment_buffer_no_check();
			}
			else
			{
				zName = c ? DN_invalid : DN_truncated;
			}
		}
		else
		{
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
#define TEMPLATE_PARAMETER "template-parameter-"
#define TEMPLATE_PARAMETER_STRING_LITERAL "`template-parameter-"_l
#define TEMPLATE_PARAMETER_LEN 19
#define GENERIC_TYPE "generic-type-"
#define GENERIC_TYPE_STRING_LITERAL "`generic-type-"_l
#define GENERIC_TYPE_LEN 13

			bool isGenericType = false;
			StringLiteral genericType = ""_l;
			if (und_strncmp(gName, TEMPLATE_PARAMETER, TEMPLATE_PARAMETER_LEN) == 0)
			{
				isGenericType = true;
				genericType = TEMPLATE_PARAMETER_STRING_LITERAL;
				increment_buffer_no_check(TEMPLATE_PARAMETER_LEN);
			}
			else if (und_strncmp(gName, GENERIC_TYPE, GENERIC_TYPE_LEN) == 0)
			{
				isGenericType = true;
				genericType = GENERIC_TYPE_STRING_LITERAL;
				increment_buffer_no_check(GENERIC_TYPE_LEN);
			}

			if (isGenericType)
			{
				DName dimension = getSignedDimension();

				if (haveTemplateParameters() && (m_pGetParameter != nullptr))
				{
					char buffer[16]{0};

					dimension.getString(buffer, 16);

					if (const char* str = (*m_pGetParameter)(atol(buffer)))
					{
						zName = DName(this, str, StringLifeSelector<StringLife::Unknown>{});
					}
					else
					{
						zName = genericType + dimension + '\'';
					}
				}
				else
				{
					zName = genericType + dimension + '\'';
				}
			}
			else
#endif
			if (fAllowEmptyName  &&  *gName == '@')
			{
				// Empty zname is used in old-style template function decorated names
				zName = DName(this);
				increment_buffer_no_check();
			}
			else
			{
				//	Extract the 'zname' to the terminator

				zName = DName(this, gName, '@');	// This constructor updates 'name'
			}
		}


		//	Add it to the current list of 'zname's

		if (fUpdateCachedNames && !pZNameList->isFull())
			*pZNameList += zName;

		//	And return the symbol name
		return zName;

	}	// End of IF else
}	// End of "UnDecorator" FUNCTION "getZName"



inline DName UnDecorator::getOperatorName(bool fIsTemplate, bool *pfReadTemplateArguments)
{
	DName operatorName(this);
	DName tmpName(this);
	int udcSeen = FALSE;
	int index = 0;


	//	So what type of operator is it ?

	switch (get_current_character_and_increment_buffer())
	{
	case 0:
		return DName(this, DN_truncated);

	case OC_ctor:
	case OC_dtor:
		//
		// The constructor and destructor are special:
		// Their operator name is the name of their first enclosing scope, which
		// will always be a tag, which may be a template specialization!
		//
	{
		//
		// Is this a specialization of a member function template? If it is
		// then we will actually have the template arguments between the "name"
		// of the operator and the scope: so we need to read the template
		// arguments before we try to read the name of the class
		//
		DName templateArguments(this);

		if (fIsTemplate)
		{
			templateArguments += '<' + getTemplateArgumentList();

			if (templateArguments.getLastChar() == '>')
			{
				templateArguments += ' ';
			}

			templateArguments += '>';

			if (pfReadTemplateArguments != NULL)
			{
				*pfReadTemplateArguments = true;
			}

			//
			// It is possible that we only want to decode the template
			// arguments -- this happens when want to create a name like
			// mf<int> to use in meta-data
			//
			if (*gName == '\0')
			{
				return templateArguments;
			}

			increment_buffer_no_check();
		}

		//
		// Use a temporary.  Don't want to advance the name pointer
		//
		pcchar_t pName = gName;

		operatorName = getZName(false);

		gName = pName;		// Undo our lookahead

		if (!operatorName.isEmpty() && (gName[-1] == OC_dtor))
			operatorName = '~' + operatorName;

		//
		// Append the template arguments (if there are any)
		//
		if (!templateArguments.isEmpty())
		{
			operatorName += templateArguments;
		}

		return operatorName;

	}	// End of CASE 'OC_ctor,OC_dtor'
	break;

	case OC_new:
	case OC_delete:
	case OC_assign:
	case OC_rshift:
	case OC_lshift:
	case OC_not:
	case OC_equal:
	case OC_unequal:
		operatorName = nameTable[gName[-1] - OC_new];
		break;

	case OC_udc:
		udcSeen = TRUE;
		[[fallthrough]];

	case OC_index:
	case OC_pointer:
	case OC_star:
	case OC_incr:
	case OC_decr:
	case OC_minus:
	case OC_plus:
	case OC_amper:
	case OC_ptrmem:
	case OC_divide:
	case OC_modulo:
	case OC_less:
	case OC_leq:
	case OC_greater:
	case OC_geq:
	case OC_comma:
	case OC_call:
	case OC_compl:
	case OC_xor:
	case OC_or:
	case OC_land:
	case OC_lor:
	case OC_asmul:
	case OC_asadd:
	case OC_assub:			// Regular operators from the first group
		operatorName = nameTable[gName[-1] - OC_index + (OC_unequal - OC_new + 1)];
		break;

	case '_':
		switch (get_current_character_and_increment_buffer())
		{
		case 0:
			return DName(this, DN_truncated);

		case OC_asdiv:
		case OC_asmod:
		case OC_asrshift:
		case OC_aslshift:
		case OC_asand:
		case OC_asor:
		case OC_asxor:	// Regular operators from the extended group
			operatorName = nameTable[gName[-1] - OC_asdiv + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)];
			break;

		case OC_vftable:
		case OC_vbtable:
			return DName(this, nameTable[gName[-1] - OC_asdiv + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)]);
			break;

		case OC_vcall:
		{
			DName result(this, nameTable[gName[-1] - OC_asdiv + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)]);

			result.setIsVCallThunk();

			return result;
		}
		break;

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
		case OC_string:
		{
			DName result = getStringEncoding(PrefixKind::StringLiteral, TRUE);
			result.setIsNoTE();
			return result;
		}
#endif

		case OC_metatype:
		case OC_guard:
		case OC_vbdtor:
		case OC_vdeldtor:
		case OC_defctor:
		case OC_sdeldtor:
		case OC_vctor:
		case OC_vdtor:
		case OC_vallctor:
		case OC_vdispmap:
		case OC_ehvctor:
		case OC_ehvdtor:
		case OC_ehvctorvb:
		case OC_copyctorclosure:
		case OC_locvfctorclosure:
		case OC_locvftable:	// Special purpose names
		case OC_placementDeleteClosure:
		case OC_placementArrayDeleteClosure:
			return DName(this, nameTable[gName[-1] - OC_metatype + (OC_vcall - OC_asdiv + 1) + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)]);

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
		case OC_udtthunk:
			operatorName = nameTable[gName[-1] - OC_metatype + (OC_vcall - OC_asdiv + 1) + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)];
			tmpName = getOperatorName(false, NULL);
			if (!tmpName.isEmpty() && tmpName.isUDTThunk())
				return DName(this, DN_invalid);
			return operatorName + tmpName;
			break;
		case OC_eh_init:
			break;
#endif
		case OC_rtti_init:
			operatorName = nameTable[gName[-1] - OC_metatype + (OC_vcall - OC_asdiv + 1) + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)];
			if (!gName[0])
				return operatorName + DN_truncated;
			index = gName[0] - OC_rtti_TD;
			if (index < 0 || static_cast<size_t>(index) >= _countof(rttiTable))
				return DName(this, DN_invalid);

			tmpName = rttiTable[index];

			switch (get_current_character_and_increment_buffer())
			{
			case OC_rtti_TD:
			{
				DName result = getDataType(NULL);
				return result + ' ' + operatorName + tmpName;
			}
			break;
			case OC_rtti_BCD:
			{
				DName result = operatorName + tmpName;
				result += getSignedDimension() + ',';
				result += getSignedDimension() + ',';
				result += getSignedDimension() + ',';
				result += getDimension() + ')';
				return result + '\'';
			}
			break;
			case OC_rtti_BCA:
			case OC_rtti_CHD:
			case OC_rtti_COL:
				return operatorName + tmpName;
			}
			break;

		case OC_arrayNew:
		case OC_arrayDelete:
			operatorName = nameTable[gName[-1] - OC_metatype + (OC_vcall - OC_asdiv + 1) + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)];
			break;

			// Yet another level of nested encodings....
		case '?':
			switch (get_current_character_and_increment_buffer())
			{

			case 0:
				return DName(this, DN_truncated);

			case OC_anonymousNamespace:
				//
				// Anonymous namespace (new-style) is a string encoding of the
				// machine name and the translation unit name.  Since the remainder
				// of the name doesn't really fit the dname grammar, skip it.
				// There are two '@' markers in the name....
				//
			{
				DName result = getStringEncoding(PrefixKind::AnonymousNamespace, FALSE);
				result.setIsNoTE();
				return result;
			}

			default:
				return DName(this, DN_invalid);
			}
			break;

			//
			// A double extended operator
			//
		case '_':
			switch (get_current_character_and_increment_buffer())
			{
			case OC_man_vec_ctor:
			case OC_man_vec_dtor:
			case OC_ehvcctor:
			case OC_ehvcctorvb:
			case OC_vec_copy_ctor:
			case OC_vec_copy_ctor_vb:
			case OC_man_vec_copy_ctor:
			case OC_thread_guard:
			case OC_await:
			case OC_spaceship:
				return DName(this, nameTable[gName[-1] - OC_man_vec_ctor + (OC_placementArrayDeleteClosure - OC_metatype + 1) + (OC_vcall - OC_asdiv + 1) + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)]);

			case OC_staticinit:
			case OC_staticatexit:
			{
				DName result(this, nameTable[gName[-1] - OC_man_vec_ctor + (OC_placementArrayDeleteClosure - OC_metatype + 1) + (OC_vcall - OC_asdiv + 1) + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)]);

				// Is the 'name' after the operator decorated or not? How is this
				// possible? Well consider the following:
				//
				//   int f()
				//
				//   int g = f();
				//
				//   struct X {
				//      static int s;
				//   };
				//
				//   int X::s = f();
				//
				// The name for the initializer for g is '??__Eg@@YAXXZ' while the
				// name for the initializer for X::s is '??__E?s@X@@2HA@@YAXXZ'. So
				// we either have a decorated name or a simple symbol name. Undecorate
				// the names appropriate.
				if (*gName == '?')
				{
					result += getDecoratedName();

					// If the decorated name ends withe '@' skip it so that we are ready to process
					// the next section
					if (*gName == '@')
					{
						increment_buffer_no_check();
					}
				}
				else
				{
					result += getSymbolName();
				}

				result += "''"_l;

				return result;
			}
			break;

			case OC_udl:
			{
				DName result(this, nameTable[gName[-1] - OC_man_vec_ctor + (OC_placementArrayDeleteClosure - OC_metatype + 1) + (OC_vcall - OC_asdiv + 1) + (OC_assub - OC_index + 1) + (OC_unequal - OC_new + 1)]);

				if (*gName == 0)
				{
					return DName(this, DN_invalid);
				}

				while (*gName != '\0' && *gName != '@')
				{
					result += *gName;
					increment_buffer_no_check();
				}

				if (*gName == '@')
				{
					increment_buffer_no_check();
				}

				return result;
			}
			break;
			case OC_NTTP_class_type:
				if (get_current_character_and_increment_buffer() == TC_value_object)
				{
					return getValueObject();
				}
				return DName(this, DN_invalid);
			default:
				return DName(this, DN_invalid);
			}
			break;

		default:
			return DName(this, DN_invalid);

		}	// End of SWITCH
		break;

	default:
		return DName(this, DN_invalid);

	}	// End of SWITCH

	//	This really is an operator name, so prefix it with 'operator'

	if (udcSeen)
		operatorName.setIsUDC();
	else if(!operatorName.isEmpty())
		operatorName = "operator"_l + operatorName;

	return operatorName;

}	// End of "UnDecorator" FUNCTION "getOperatorName"

DName UnDecorator::getStringEncoding(PrefixKind kind, int /*unused*/)
{
	DName result(this, PrefixName[static_cast<int>(kind)]);

	// First @ comes right after operator code
	if (get_current_character_and_increment_buffer() != '@' ||
		get_current_character_and_increment_buffer() != '_')
	{
		return DName(this, DN_invalid);
	}

	// Skip the string kind
	if (!increment_buffer(1))
	{
		return DName(this, DN_truncated);
	}

	// Get (& discard) the length
	getDimension();

	// Get (& discard) the checksum
	getDimension();

	while (*gName && *gName != '@')
	{
		// For now, we'll just skip it
		increment_buffer_no_check();
	}

	if (!*gName)
	{
		gName--;
		return DName(this, DN_truncated);
	}

	// Eat the terminating '@'
	increment_buffer_no_check();

	return result;
}


DName UnDecorator::getScope(void)
{
	DName scope(this);
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
	bool fNeedBracket = false;
#endif

	//	Get the list of scopes

	while ((scope.status() == DN_valid) && *gName && (*gName != '@'))
	{	//	Insert the scope operator if not the first scope

		if (fExplicitTemplateParams && !fGetTemplateArgumentList)
		{
			return scope;
		}
		if (!scope.isEmpty())
		{
			scope = "::"_l + scope;

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
			if (fNeedBracket)
			{
				scope = '[' + scope;
				fNeedBracket = false;
			}
#endif
		}

		//	Determine what kind of scope it is

		if (*gName == '?')
		{
			increment_buffer_no_check();
			switch (*gName)
			{
			case '?':
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
				if (gName[1] == '_' && gName[2] == '?')
				{
					//
					// Anonymous namespace name (new style)
					//
					increment_buffer_no_check();
					scope = getOperatorName(false, NULL) + scope;

					// There should be a zname termination @...
					if (*gName == '@')
					{
						increment_buffer_no_check();
					}
				}
				else
#endif
					scope = '`' + getDecoratedName() + '\'' + scope;
				break;

			case '$':
				// It's a template name, which is a kind of zname; back up
				// and handle like a zname.
				gName--;
				scope = getZName(true) + scope;
				break;

			case 'A':
				//
				// This is a new-new encoding for anonymous namespaces
				//
				// fall-through

			case '%':
			{
				//
				// It an anonymous namespace (old-style);
				// skip the (unreadable) name and instead insert
				// an appropriate string
				//
				DName namespaceName = DName(this, gName, '@');

				scope = "`anonymous namespace'"_l + scope;

				if (!pZNameList->isFull())
				{
					*pZNameList += namespaceName;
				}
			}
			break;
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
			case 'I':
				//
				// This is the interface whose method the class is
				// implementing
				//
				increment_buffer_no_check();
				scope = getZName(true) + ']' + scope;
				fNeedBracket = true;
				break;
#endif
			case 'Q':
				// This is new style of enclosing any interface whose method the class is implementing
			{
				DName explicitScope(this);

				increment_buffer_no_check();
				do
				{
					DName scopeName = getZName(true);

					if (scopeName.status() == DN_valid)
					{
						if (!explicitScope.isEmpty())
						{
							explicitScope = scopeName + "::"_l + explicitScope;
						}
						else
						{
							explicitScope = scopeName;
						}
					}
					else
					{
						explicitScope = DN_invalid;
					}
				} while ((explicitScope.status() == DN_valid) && (*gName != '@'));

				if (explicitScope.status() == DN_valid)
				{
					scope = '[' + explicitScope + ']';
					DASSERT(*gName == '@');
					increment_buffer_no_check();
				}
				else
				{
					scope = DN_invalid;
				}
			}
			break;
			default:
				scope = getLexicalFrame() + scope;
				break;

			}	// End of SWITCH
		}
		else
			scope = getZName(true) + scope;

	}	// End of WHILE

	//	Catch error conditions

	switch (*gName)
	{
	case 0:
		if (scope.isEmpty())
			scope = DN_truncated;
		else
			scope = DName(this, DN_truncated) + "::"_l + scope;
		break;

	case '@':		// '@' expected to end the scope list
		break;

	default:
		scope = DN_invalid;
		break;

	}	// End of SWITCH

	//	Return the composed scope

	return scope;

}	// End of "UnDecorator" FUNCTION "getScope"


DName UnDecorator::getSignedDimension(void)
{
	if (!*gName)
		return DName(this, DN_truncated);
	else if(*gName == '?')
	{
		increment_buffer_no_check();	// skip the '?'
		return '-' + getDimension();
	}
	else
		return getDimension();
}	// End of "Undecorator" FUNCTION "getSignedDimension"


DName UnDecorator::getDimension(bool is_signed)
{
	bool has_prefix = false;
	static StringLiteral prefix = "`non-type-template-parameter"_l;
	// It is safe to assume gName is never null here. It originates from a command line argument.
	_Analysis_assume_(gName != nullptr);
	if (*gName == TC_dependent_expr)
	{
		has_prefix = true;
		increment_buffer_no_check();
	}

	if (*gName == '\0')
		return DName(this, DN_truncated);

	if ((*gName >= '0') && (*gName <= '9'))
	{
		uint64_t dim = static_cast<uint64_t>(distance(*gName, '0')) + 1;
		increment_buffer_no_check();
		return has_prefix ? (prefix + DName(this, dim)) : DName(this, dim);
	}

	if (auto result = getValue())
	{
		// Consume the terminating '@'
		DASSERT(*gName == '@');
		increment_buffer_no_check();
		auto value = *result;
		if (is_signed)
		{
			return has_prefix ? (prefix + DName(this, static_cast<int64_t>(value))) : DName(this, static_cast<int64_t>(value));
		}
		else
		{
			return has_prefix ? (prefix + DName(this, value)) : DName(this, value);
		}
	}

	return (*gName == '\0') ? DName(this, DN_truncated) : DName(this, DN_invalid);
}

std::optional<std::uint64_t> UnDecorator::getValue()
{
	// Don't bother detecting overflow: it's not worth it
	std::uint64_t value = 0;
	while (true)
	{
		auto c = *gName;
		if (c == '\0')
			return { };
		if (c == '@')
			return value;
		if ((c >= 'A') && (c <= 'P'))
			value = (value << 4) + distance(c, 'A');
		else
			return { };
		increment_buffer_no_check();
	}
}

template<typename T>
static auto get_encoding(UnDecorator* undecorator, uint64_t representation)
{
	T value = *reinterpret_cast<T*>(&representation);
	auto required_size = snprintf(nullptr, 0, "%lf", value) + 1;
	auto* buffer = gnew2 char[required_size];
	sprintf_s(buffer, required_size, "%lf", value);
	return DName(undecorator, buffer, StringLifeSelector<StringLife::Temporary>{ });
}

DName UnDecorator::getFloatingPoint(int type_category)
{
	if (*gName == '\0')
		return DName(this, DN_truncated);
	
	if ((*gName >= '0') && (*gName <= '9'))
	{
		uint64_t dim = static_cast<uint64_t>(distance(*gName, '0')) + 1;
		increment_buffer_no_check();
		return DName(this, dim);
	}

	if (auto result = getValue())
	{
		// Skip the terminator
		increment_buffer_no_check();

		auto value = *result;
		if (type_category == TC_double)
		{
			return get_encoding<double>(this, value);
		}
		else if (type_category == TC_float)
		{
			return get_encoding<float>(this, value);
		}
	}

	return (*gName == '\0') ? DName(this, DN_truncated) : DName(this, DN_invalid);
}

DName UnDecorator::getValueObject()
{
	if (*gName == '\0')
		return DName(this, DN_truncated);

	auto encoding = getTemplateTypeArgument();

	if (!encoding.isValid())
	{
		return DName(this, DN_invalid);
	}

	encoding += '{';

	bool need_comma = false;
	while (true)
	{
		// If we encounter the terminator then the decorated name must be invalid
		if (*gName == '\0')
			return DName(this, DN_invalid);

		if (need_comma)
		{
			encoding += ',';
		}

		switch (*gName)
		{
		case TC_value_object:
			increment_buffer_no_check();  // Consume 'TC_value_object'
			encoding += getValueObject();
			break;
		case TC_union_object:
			increment_buffer_no_check();  // Consume 'TC_union_object'
			encoding += getUnionObject();
			break;
		case TC_array_object:
			increment_buffer_no_check();  // Consume 'TC_array_object'
			encoding += getArrayObject();
			break;
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
		case TC_string_object:
			increment_buffer_no_check();  // Consume 'TC_string_object'
			encoding += getStringObject();
			break;
#endif
		case '@':
			break;
		default:
			encoding += getTemplateTypeArgument();
			encoding += ':';
			encoding += getTemplateNonTypeArgument();
			break;
		}

		if (!encoding.isValid())
		{
			return DName(this, DN_invalid);
		}

		if (*gName == '@')
		{
			increment_buffer_no_check();		// Consume the '@'
			break;
		}
		need_comma = true;
	}

	encoding += '}';

	return encoding;
}

DName UnDecorator::getArrayObject()
{
	if (*gName == '\0')
		return DName(this, DN_truncated);

	auto encoding = getTemplateTypeArgument() + '{';
	bool need_comma = false;
	while (true)
	{
		// If we encounter the terminator then the decorated name must be invalid
		if (*gName == '\0')
			return DName(this, DN_invalid);

		if (need_comma)
		{
			encoding += ',';
		}

		encoding += getTemplateNonTypeArgument();

		if (*gName != '@')
			return DName(this, DN_invalid);
		increment_buffer_no_check();		// Consume the separator '@' character

		if (*gName == '@')
		{
			increment_buffer_no_check();	// Consume the final '@'
			break;
		}

		need_comma = true;
	}

	encoding += '}';

	return encoding;
}


DName UnDecorator::getStringObject()
{
	if (*gName == '\0')
		return DName(this, DN_truncated);

	// First we need to skip the string literal prefix which is "??_C"
	if (strncmp(gName, "??_C", std::size("??_C") - 1) == 0)
	{
		increment_buffer_no_check(std::size("??_C") - 1);
		DName encoding = getStringEncoding(PrefixKind::StringLiteral, true);
		if (*gName == '@')
		{
			// Consume the terminating '@'
			increment_buffer_no_check();
			return encoding;
		}
	}
	return DName(this, DN_invalid);
}

DName UnDecorator::getAddressOf()
{
	if (*gName == '\0')
		return DName(this, DN_truncated);
	auto encoding = DName(this, '&');
	encoding += getTemplateNonTypeArgument();
	if (*gName == '@')
	{
		// Consume the terminating '@'
		increment_buffer_no_check();
		return encoding;
	}
	return DName(this, DN_invalid);
}

DName UnDecorator::getMemberAccess()
{
	if (*gName == '\0')
		return DName(this, DN_truncated);
	auto encoding = getTemplateNonTypeArgument();
	encoding += '.';
	encoding += getZName(false, false);
	if (*gName == '@')
	{
		// Consume the terminating '@'
		increment_buffer_no_check();
		return encoding;
	}
	return DName(this, DN_invalid);
}

DName UnDecorator::getArrayAccess()
{
	if (*gName == '\0')
		return DName(this, DN_truncated);
	auto encoding = getTemplateNonTypeArgument();
	encoding += '[';
	encoding += getTemplateNonTypeArgument();
	encoding += ']';
	if (*gName == '@')
	{
		// Consume the terminating '@'
		increment_buffer_no_check();
		return encoding;
	}

	return DName(this, DN_invalid);
}

DName UnDecorator::getUnionObject()
{
	if (*gName == '\0')
		return DName(this, DN_truncated);
	auto encoding = getTemplateTypeArgument() + '{';
	// Note: we may have a union without an active member
	if (*gName != '@')
	{
		encoding += getZName(false, false);
		encoding += ':';
		encoding += getTemplateNonTypeArgument();
	}
	encoding += '}';
	if (*gName == '@')
	{
		// Consume the terminating '@'
		increment_buffer_no_check();
		return encoding;
	}
	return DName(this, DN_invalid);
}

DName UnDecorator::getPointerToMember()
{
	if (*gName == '\0')
		return DName(this, DN_truncated);
	auto encoding = DName(this, '&');
	encoding += getScope();
	if (encoding.isValid() && (*gName == '@'))
	{
		// Consume the '@' that terminates the scope encoding
		increment_buffer_no_check();
		encoding += "::"_l;
		encoding += getZName(false, false);
		if (*gName == '@')
		{
			// Consume the terminating '@'
			increment_buffer_no_check();
			return encoding;
		}
	}
	return DName(this, DN_invalid);
}


int UnDecorator::getNumberOfDimensions(void)
{
	DASSERT(*gName);

	if ((*gName >= '0') && (*gName <= '9'))
	{
		int dim = (*gName - '0') + 1;
		increment_buffer_no_check();
		return dim;
	}
	else
	{
		int dim = 0;


		//	Don't bother detecting overflow, it's not worth it

		while (*gName != '@')
		{
			if (!*gName)
				return 0;
			else if((*gName >= 'A') && (*gName <= 'P'))
				dim = (dim << 4) + (*gName - 'A');
			else
				return -1;

			increment_buffer_no_check();

		}	// End of WHILE

		//	Ensure integrity, and return

		DASSERT(*gName == '@');
		increment_buffer_no_check();
		return dim;

	}	// End of else if else
}	// End of "UnDecorator" FUNCTION "getNumberOfDimensions"


DName UnDecorator::getTemplateName(bool fReadTerminator)
{
	//
	// First make sure we're really looking at a template name
	//
	if (gName[0] != '?' || gName[1] != '$')
		return DName(this, DN_invalid);

	increment_buffer_no_check(2);			// Skip the marker characters

	//
	// Stack the replicators, since template names are their own replicator scope:
	//
	Replicator * pSaveArgList = pArgList;
	Replicator * pSaveZNameList = pZNameList;
	Replicator * pSaveTemplateArgList = pTemplateArgList;

	Replicator localArgList(this), localZNameList(this), localTemplateArgList(this);

	pArgList = &localArgList;
	pZNameList = &localZNameList;
	pTemplateArgList = &localTemplateArgList;

	//
	// Crack the template name:
	//
	DName templateName(this);
	bool fReadTemplateArguments = false;

	if (*gName == '?')
	{
		increment_buffer_no_check();

		templateName = getOperatorName(true, &fReadTemplateArguments);
	}
	else
	{
		templateName = getZName(true, true);
	}

	if (templateName.isEmpty())
	{
		fExplicitTemplateParams = true;
	}

	//
	// If we haven't already read the template arguments then
	// now is the time to read them
	//
	if (!fReadTemplateArguments)
	{
		templateName += '<';
		templateName += getTemplateArgumentList();

		if (templateName.getLastChar() == '>')
		{
			templateName += ' ';
		}

		templateName += '>';

		if (fReadTerminator && *gName)
		{
			increment_buffer_no_check();
		}
	}

	//
	// Restore the previous replicators:
	//
	pArgList = pSaveArgList;
	pZNameList = pSaveZNameList;
	pTemplateArgList = pSaveTemplateArgList;

	//	Return the completed 'template-name'

	return templateName;

}	// End of "UnDecorator" FUNCTION "getTemplateName"


DName UnDecorator::getTemplateArgumentList(void)
{
	bool first = true;
	DName aList(this);
	fGetTemplateArgumentList = true;

	while ((aList.status() == DN_valid) && *gName && (*gName != AT_endoflist))
	{
		//	Insert the argument list separator if not the first argument

		bool needComma = false;

		if (first)
		{
			first = false;
		}
		else
		{
			needComma = true;
		}

		//	Get the individual argument type

		int argIndex = *gName - '0';
		DName arg(this);
		bool havePackExpansion = false;

		//	Handle 'template-argument-replicators', otherwise a new argument type

		if ((argIndex >= 0) && (argIndex <= 9))
		{
			increment_buffer_no_check();	// Skip past the replicator

			// Argument to append to the argument list

			arg = (*pTemplateArgList)[argIndex];

		}	// End of IF then
		else
		{
			pcchar_t oldGName = gName;

			if ((*gName == PDT_extend) && (*(gName + 1) == PDT_extend))
			{
				bool skipArgument = false;
				switch (*(gName + 2))
				{
				case PDT_packExpansion:
					havePackExpansion = true;
					increment_buffer_no_check(3);
					break;
				case PDT_placeHolder:
					increment_buffer_no_check(3);
					break;
				case PDT_empty:
				case PDT_terminator:
					increment_buffer_no_check(3);
					skipArgument = true;
					break;
				case PDT_extend:
					// We have a bug (in older builds of the compiler) in which 'empty' is encoded with an extra '$'
					if (*(gName + 3) == PDT_empty)
					{
						increment_buffer_no_check(4);
						skipArgument = true;
					}
					break;
				default:
					break;
				}

				if (skipArgument)
				{
					continue;
				}
			}

			// Extract the 'argument' type
			if ((*gName == '$') && (gName[1] != '$'))
			{
				increment_buffer_no_check();
				arg = getTemplateNonTypeArgument();
			}
			else
			{
				arg = getTemplateTypeArgument();
			}

			// Add it to the current list of 'template-argument's, if it is bigger than a one byte encoding
			if (((gName - oldGName) > 1) && !pTemplateArgList->isFull())
				*pTemplateArgList += arg;
		}	// End of IF else

		//	Append to the argument list
		if (!arg.isEmpty())
		{
			if (needComma)
			{
				aList += ',';
			}

			aList += arg;

			if (havePackExpansion)
			{
				aList += "..."_l;
			}
		}
		else
		{
			// If we failed to decode a template argument then we should bail
			if (!arg.isValid())
			{
				return DName(this, DN_invalid);
			}
		}
	}

	// Return the completed template argument list
	fGetTemplateArgumentList = false;

	return aList;

}	// End of "UnDecorator" FUNCTION "getTemplateArgumentList"

using uint_t = unsigned int;

union TPI_t
{
	uint_t index_;	// the old way
#pragma warning(push)
#pragma warning(disable: 4201) // nonstandard extension used: nameless struct/union
	struct
	{
		uint_t number_ : 12;
		uint_t nesting_ : 8;
		uint_t cumulative_parent_number_ : 10;
		uint_t is_generic_ : 1;		// generic type or method parameter
		uint_t is_mvar_ : 1;		// generic method parameter
	};
#pragma warning(pop)
};

DName UnDecorator::getTemplateNonTypeArgument(void)
{
	//
	// template-constant ::=
	//		'0'	<template-integral-constant>
	//		'1' <template-address-constant>
	//		'2' <template-floating-point-constant>
	//
	char type_category = get_current_character_and_increment_buffer();
	switch (type_category)
	{
		//
		// template-integral-constant ::=
		//		<signed-dimension>
		//
	case TC_integral:
		return 	getSignedDimension();

		//
		// template-address-constant ::=
		//		'@'			// Null pointer
		//		<decorated-name>
		//
	case TC_address:
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
		if (*gName == TC_nullptr)
		{
			increment_buffer_no_check();
			return DName(this, "NULL"_l);
		}
		else
#endif
			return DName(this, '&') + getDecoratedName();

		//
		// template-name ::=
		//		<decorated-name>
		//
	case TC_name:
		return getDecoratedName();

	case TC_vptmd:
	case TC_gptmd:
	case TC_mptmf:
	case TC_vptmf:
	case TC_gptmf:
	{
		DName ptm(this, '{');

		switch (type_category)
		{
		case TC_mptmf:
		case TC_vptmf:
		case TC_gptmf:
			ptm += getDecoratedName();
			ptm += ',';
			break;
		}

		switch (type_category)
		{
		case TC_gptmf:
		case TC_gptmd:
			ptm += getSignedDimension();
			ptm += ',';
			[[fallthrough]];

		case TC_vptmd:
		case TC_vptmf:
			ptm += getSignedDimension();
			ptm += ',';
			[[fallthrough]];

		case TC_mptmf:
			ptm += getSignedDimension();
		}

		return ptm + '}';
	}
	break;

	case TC_empty:
		return DName(this);
		break;

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
	case TC_template_type_parameter:
	case TC_template_type_parameter_pack:
	case TC_generic_class_parameter:
	case TC_generic_method_parameter:
	{
		// This is a template-parameter, i.e. we have a "specialization" of X<n>. so get the template-parameter-index and use
		// a "generic" name for this parameter
		DName dimension = getSignedDimension();
		char buffer[16]{0};
		dimension.getString(buffer, _countof(buffer));

		TPI_t tpi;

		tpi.index_ = atol(buffer);

		if (haveTemplateParameters() && (m_pGetParameter != nullptr))
		{
			if (const char* pName = (*m_pGetParameter)(tpi.number_))
			{
				return DName(this, pName, StringLifeSelector<StringLife::Unknown>{});
			}
		}

		sprintf_s(buffer, _countof(buffer), "%d", tpi.number_);
		DName index(this, buffer, StringLifeSelector<StringLife::Temporary>{});

		switch (type_category)
		{
		case TC_template_type_parameter:
		case TC_template_type_parameter_pack:
			return "`template-type-parameter-"_l + index + '\'';
			break;
		case TC_generic_class_parameter:
			return "`generic-class-parameter-"_l + index + '\'';
			break;
		case TC_generic_method_parameter:
			return "`generic-method-parameter-"_l + index + '\'';
			break;
		}

		return DName(this, DN_invalid);
	}
	break;
#endif
	case TC_dependent_expr:
		return DName(this, DN_invalid);
		break;
	case TC_auto:
	{
		// Consume the deduced type
		DName type(getTemplateTypeArgument());
		if (!type.isValid())
		{
			return DName(this, DN_invalid);
		}

		return getTemplateNonTypeArgument();
	}
	break;
	case TC_float:
	case TC_double:
		return getFloatingPoint(type_category);
	case TC_value_object:
		return getValueObject();
	case TC_string_object:
		return getStringObject();
	case TC_address_of:
		return getAddressOf();
	case TC_member_access:
		return getMemberAccess();
	case TC_union_object:
		return getUnionObject();
	case TC_pointer_to_member:
		return getPointerToMember();
	case TC_array_access:
		return getArrayAccess();
	case TC_null_pointer_to_member:
		return DName(this, "nullptr"_l);
	case TC_lambda:
		(void) getDimension();
		return DName(this, "lambda"_l);
	case '\0':
		return DName(this, DN_truncated);
	default:
		return DName(this, DN_invalid);
	}
}

DName UnDecorator::getTemplateTypeArgument(void)
{
	if (*gName == BDT_void)
	{
		increment_buffer_no_check();
		return DName(this, "void"_l);
	}
	else if (*gName == '?')
	{
		//
		// This is a template-parameter, i.e. we have a "specialization" of
		// X<T>. so get the template-parameter-index and use a "generic" name
		// for this parameter
		//
		DName dimension = getSignedDimension();

		if (haveTemplateParameters() && (m_pGetParameter != nullptr))
		{
			char buffer[16]{0};

			dimension.getString(buffer, 16);

			if (const char* str = (*m_pGetParameter)(atol(buffer)))
			{
				return DName(this, str, StringLifeSelector<StringLife::Unknown>{});
			}
			else
			{
				return "`template-parameter"_l + dimension + '\'';
			}
		}
		else
		{
			return "`template-parameter"_l + dimension + '\'';
		}
	}
	else
	{
		return getPrimaryDataType(DName(this));
	}
}

inline DName UnDecorator::composeDeclaration(const DName & symbol)
{
	DName declaration(this);
    unsigned long chpeOffset = (unsigned long)(gName - name);
	unsigned int typeCode = getTypeEncoding();
	int symIsUDC = symbol.isUDC();


	//	Handle bad typeCode's, or truncation

	if (TE_isbadtype(typeCode))
		return DName(this, DN_invalid);
	else if(TE_istruncated(typeCode))
		return (DN_truncated + symbol);
	else if(TE_isCident(typeCode))
		return symbol;

	//	This is a very complex part.  The type of the declaration must be
	//	determined, and the exact composition must be dictated by this type.

	//	Is it any type of a function ?
	//	However, for ease of decoding, treat the 'localdtor' thunk as data, since
	//	its decoration is a function of the variable to which it belongs and not
	//	a usual function type of decoration.

	if (TE_isfunction(typeCode) && !((TE_isthunk(typeCode) && TE_islocaldtor(typeCode)) ||
		(TE_isthunk(typeCode) && (TE_istemplatector(typeCode) || TE_istemplatedtor(typeCode)))))
	{
		//	If it is based, then compose the 'based' prefix for the name

		if (TE_isbased(typeCode))
			if (doMSKeywords() && doAllocationModel())
				declaration = ' ' + getBasedType();
			else
				declaration |= getBasedType();	// Just lose the 'based-type'

		//	Check for some of the specially composed 'thunk's

		if (TE_isthunk(typeCode) && TE_isvcall(typeCode))
		{
			declaration += symbol + '{' + getCallIndex();

			DName thunkType = getVCallThunkType();

			if (!doNameOnly())
			{
				declaration += ',' + thunkType + "}' "_l;
			}

			declaration += "}'"_l;

			DName callingConvention = getCallingConvention();

			if (doMSKeywords() && doAllocationLanguage() && !doNameOnly())
			{
				declaration = ' ' + callingConvention + ' ' + declaration;	// What calling convention ?
			}
			else
			{
				declaration |= callingConvention;	// Just lose the calling convention
			}

		}	// End of IF then
		else
		{
			DName vbptrDisp(this);
			DName vbindex(this);
			DName vtorDisp(this);
			DName adjustment(this);
			DName thisType(this);

			if (TE_isthunk(typeCode))
			{
				if (TE_isvtoradjex(typeCode))
				{
					vbptrDisp = getDisplacement();
					vbindex = getDisplacement();
					vtorDisp = getDisplacement();
				}
				else if (TE_isvtoradj(typeCode))
				{
					vtorDisp = getDisplacement();
				}

				adjustment = getDisplacement();

			}	// End of IF else

			//	Get the 'this-type' for non-static function members

			if (TE_ismember(typeCode) && !TE_isstatic(typeCode))
				if (doThisTypes())
					thisType = getThisType();
				else
					thisType |= getThisType();

			if (doMSKeywords())
			{
				//	Attach the calling convention

				if (doAllocationLanguage())
					declaration = getCallingConvention() + declaration;	// What calling convention ?
				else
					declaration |= getCallingConvention();	// Just lose the 'calling-convention'
			}	// End of IF
			else
				declaration |= getCallingConvention();	// Just lose the 'calling-convention'

			//	Now put them all together

			if (!symbol.isEmpty())
				if (!declaration.isEmpty() && !doNameOnly())			// And the symbol name
					declaration += ' ' + symbol;
				else
					declaration = symbol;


			//	Compose the return type, catching the UDC case

			DName *	pDeclarator = 0;
			DName returnType(this);


			if (symIsUDC)		// Is the symbol a UDC operator ?
			{
				declaration += ' ' + getReturnType();

				if (doNameOnly())
					return declaration;
			}
			else
			{
				pDeclarator = gnew DName(this);
				returnType = getReturnType(pDeclarator);

			}	// End of IF else

			//	Add the displacements for virtual function thunks

			if (TE_isthunk(typeCode))
			{
				if (TE_isvtoradjex(typeCode))
					declaration += "`vtordispex{"_l + vbptrDisp + ',' + vbindex + ',' + vtorDisp + ',';
				else if (TE_isvtoradj(typeCode))
					declaration += "`vtordisp{"_l + vtorDisp + ',';
				else
					declaration += "`adjustor{"_l;

				declaration += adjustment + "}' "_l;

			}	// End of IF

            // If this is a function and we are at the top level of recursion
            // (i.e. not inside a template scope), save the offset as the chpe
            // offset.

            if (m_recursionLevel == 1 && m_CHPENameOffset == 0)
            {
                m_CHPENameOffset = chpeOffset;
            }

			//	Add the function argument prototype

			declaration += '(' + getArgumentTypes() + ')';

			//	If this is a non-static member function, append the 'this' modifiers

			if (TE_ismember(typeCode) && !TE_isstatic(typeCode))
				declaration += thisType;

#if CC_RESTRICTION_SPEC
			// Add restriction modifiers if there is any
			if (doRestrictionSpec())
				declaration += getRestrictionSpec();
			else
				declaration |= getRestrictionSpec();	// Just lose the 'restriction specification'
#endif // CC_RESTRICTION_SPEC

			declaration += getNoexcept();

			//	Add the 'throw' signature

			if (doThrowTypes())
				declaration += getThrowTypes();
			else
				declaration |= getThrowTypes();	// Just lose the 'throw-types'

#if CC_RESTRICTION_SPEC
			// skip any dispatch target encoding since it's not part of original function signature
			declaration |= getDispatchTarget();
#endif // CC_RESTRICTION_SPEC

			//	If it has a declarator, then insert it into the declaration,
			//	sensitive to the return type composition

			if (doFunctionReturns() && pDeclarator)
			{
				*pDeclarator = declaration;
				declaration = returnType;

			}	// End of IF
		}	// End of IF else
	}	// End of IF then
	else
	{
		declaration += symbol;

		//	Catch the special handling cases

		if (TE_isvftable(typeCode))
			return getVfTableType(declaration);
		else if(TE_isvbtable(typeCode))
			return getVbTableType(declaration);
		else if(TE_isguard(typeCode))
			return (declaration + '{' + getGuardNumber() + "}'"_l);
		else if(TE_isvdispmap(typeCode))
			return getVdispMapType(declaration);
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
		else if(TE_isthunk(typeCode) && TE_islocaldtor(typeCode))
			declaration += "`local static destructor helper'"_l;
#endif
		else if(TE_isthunk(typeCode) && TE_istemplatector(typeCode))
			declaration += "`template static data member constructor helper'"_l;
		else if(TE_isthunk(typeCode) && TE_istemplatedtor(typeCode))
			declaration += "`template static data member destructor helper'"_l;
		else if(TE_ismetaclass(typeCode))
			//
			// Meta-class information has its information in its operator id
			//
			return declaration;

		if (TE_isthunk(typeCode) && (TE_istemplatector(typeCode) || TE_istemplatedtor(typeCode)))
		{
			//
			// Insert a space before the declaration
			//
			declaration = ' ' + declaration;
		}
		else
		{
			//	All others are decorated as data symbols
			declaration = getExternalDataType(declaration);
		}

	}	// End of IF else

	//	Prepend the 'virtual' and 'static' attributes for members

	if (TE_ismember(typeCode))
	{
		if (doMemberTypes())
		{
			if (TE_isstatic(typeCode))
				declaration = "static "_l + declaration;

			if (TE_isvirtual(typeCode) || (TE_isthunk(typeCode) && (TE_isvtoradj(typeCode) || TE_isvtoradjex(typeCode) || TE_isadjustor(typeCode))))
				declaration = "virtual "_l + declaration;

		}	// End of IF

		//	Prepend the access specifiers

		if (doAccessSpecifiers())
			if (TE_isprivate(typeCode))
				declaration = "private: "_l + declaration;
		else if(TE_isprotected(typeCode))
			declaration = "protected: "_l + declaration;
		else if(TE_ispublic(typeCode))
			declaration = "public: "_l + declaration;

	}	// End of IF

	//	If it is a thunk, mark it appropriately

	if (TE_isthunk(typeCode) && !doNameOnly())
		declaration = "[thunk]:"_l + declaration;

	//	Return the composed declaration

	if (TE_isexternc(typeCode))
	{
		declaration = "extern \"C\" "_l + declaration;
	}

	return declaration;

}	// End of "UnDecorator" FUNCTION "composeDeclaration"


inline int UnDecorator::getTypeEncoding(void)
{
	unsigned int typeCode = 0u;


	//	Strip any leading '_' which indicates that it is based

	if (*gName == '_')
	{
		TE_setisbased(typeCode);

		increment_buffer_no_check();

	}	// End of IF

	//	Now handle the code proper :-

	if ((*gName >= 'A') && (*gName <= 'Z'))	// Is it some sort of function ?
	{
		int code = *gName - 'A';
		increment_buffer_no_check();

		//	Now determine the function type

		TE_setisfunction(typeCode);	// All of them are functions ?

		//	Determine the calling model

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
		if (code & TE_far)
			TE_setisfar(typeCode);
		else
#endif
			TE_setisnear(typeCode);

		//	Is it a member function or not ?

		if (code < TE_external)
		{
			//	Record the fact that it is a member

			TE_setismember(typeCode);

			//	What access permissions does it have

			switch (code & TE_access)
			{
			case TE_private:
				TE_setisprivate(typeCode);
				break;

			case TE_protect:
				TE_setisprotected(typeCode);
				break;

			case TE_public:
				TE_setispublic(typeCode);
				break;

			default:
				TE_setisbadtype(typeCode);
				return typeCode;

			}	// End of SWITCH

			//	What type of a member function is it ?

			switch (code & TE_adjustor)
			{
			case TE_adjustor:
				TE_setisadjustor(typeCode);
				break;

			case TE_virtual:
				TE_setisvirtual(typeCode);
				break;

			case TE_static:
				TE_setisstatic(typeCode);
				break;

			case TE_member:
				break;

			default:
				TE_setisbadtype(typeCode);
				return typeCode;

			}	// End of SWITCH
		}	// End of IF
	}	// End of IF then
	else if(*gName == '$')	// Extended set ?  Special handling
	{
		increment_buffer_no_check();

		//	What type of symbol is it ?
		bool isVtorDispThunkEx = false;
		switch (*gName)
		{
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
		case SHF_localdtor:	// A destructor helper for a local static ?
			TE_setislocaldtor(typeCode);
			break;
#endif

		case SHF_vcall:	// A VCall-thunk ?
			TE_setisvcall(typeCode);
			break;

		case SHF_templateStaticDataMemberCtor:	// A constructor helper for template static data members
			TE_setistemplatector(typeCode);
			break;

		case SHF_templateStaticDataMemberDtor:	// A destructor helper for template static data members
			TE_setistemplatedtor(typeCode);
			break;
		case SHF_vdispmap:
			TE_setvdispmap(typeCode);
			break;

		case '$':
		{
			increment_buffer_no_check();
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
			if (*gName == SHF_AnyDLLImportMethod)
			{
				increment_buffer_no_check();
			}
#endif

			switch (*gName)
			{
			case SHF_CPPManagedILFunction:				// C++ managed-IL function
			case SHF_CPPManagedILMain:					// C++ managed-IL main
			case SHF_CPPManagedILDLLImportData:			// C++ managed-IL DLL-import function
			case SHF_CPPManagedNativeDLLImportData:		// C++ managed-native DLL-import function
				//
				// Skip the encoding
				//
				increment_buffer_no_check();
				return getTypeEncoding();

			case SHF_CManagedILFunction:				// C (or extern "C") managed-IL function
			case SHF_CManagedILDLLImportData:			// C (or extern "C") managed-IL DLL-import function
			case SHF_CManagedNativeDLLImportData:		// C (or extern "C") managed-native DLL-import function
			{
				//
				// Skip the encoding
				//
				increment_buffer_no_check();

				//
				// The next character should be the number of characters
				// in the byte-count
				//
				if ((*gName >= '0') && (*gName <= '9'))
				{
					//
					// Skip the character count and the byte-count
					// itself
					//
					size_t count = static_cast<size_t>(distance(*gName, '0')) + 1;
					if (!increment_buffer(count))
					{
						TE_setistruncated(typeCode);
						return typeCode;
					}

					typeCode = getTypeEncoding();
					TE_setisisexternc(typeCode);
					return typeCode;
				}
				else if (*gName == 0)
				{
					TE_setistruncated(typeCode);
					return typeCode;
				}
				else
				{
					TE_setisbadtype(typeCode);
				}
			}
			break;

			case MGD_AppDomain:
			{
				increment_buffer_no_check(); //  this is __declspec(appdomain), but we won't say it
				return getTypeEncoding();
			}

			case SHF_Hybrid:
			{
				m_CHPENameOffset = 0; // clear the chpe name offset because this name is already chpe
				increment_buffer_no_check();
				return getTypeEncoding();
			}

			case 0:
				TE_setistruncated(typeCode);
				return typeCode;

			default:
				TE_setisbadtype(typeCode);
				return typeCode;
			}
		}
		break;

		case 0:
			TE_setistruncated(typeCode);
			return typeCode;

		case SHF_VtorDispThunkEx:
			isVtorDispThunkEx = true;

			increment_buffer_no_check();
			if (*gName < '0' || *gName > '5') // case labels below
			{
				if (*gName == 0)
					TE_setistruncated(typeCode);
				else
					TE_setisbadtype(typeCode);
				return typeCode;
			}
			//fallthrough

		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':	// Construction displacement adjustor thunks
		{
			int code = *gName - '0';


			//	Set up the principal type information

			TE_setisfunction(typeCode);
			TE_setismember(typeCode);
			if (isVtorDispThunkEx)
				TE_setisvtoradjex(typeCode);
			else
				TE_setisvtoradj(typeCode);

			//	Is it 'near' or 'far' ?

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
			if (code & TE_far)
				TE_setisfar(typeCode);
			else
#endif
				TE_setisnear(typeCode);

			//	What type of access protection ?

			switch (code & TE_access_vadj)
			{
			case TE_private_vadj:
				TE_setisprivate(typeCode);
				break;

			case TE_protect_vadj:
				TE_setisprotected(typeCode);
				break;

			case TE_public_vadj:
				TE_setispublic(typeCode);
				break;

			default:
				TE_setisbadtype(typeCode);
				return typeCode;

			}	// End of SWITCH
		}	// End of CASE '0,1,2,3,4,5'
		break;

		default:
			TE_setisbadtype(typeCode);
			return typeCode;

		}	// End of SWITCH

		//	Advance past the code character

		increment_buffer_no_check();

	}	// End of else if then
	else if((*gName >= TE_static_d) && (*gName <= TE_metatype))	// Non function decorations ?
	{
		int code = *gName;
		increment_buffer_no_check();

		TE_setisdata(typeCode);

		//	What type of symbol is it ?

		switch (code)
		{
		case (TE_static_d | TE_private_d):
			TE_setisstatic(typeCode);
			TE_setisprivate(typeCode);
			break;

		case (TE_static_d | TE_protect_d):
			TE_setisstatic(typeCode);
			TE_setisprotected(typeCode);
			break;

		case (TE_static_d | TE_public_d):
			TE_setisstatic(typeCode);
			TE_setispublic(typeCode);
			break;

		case TE_global:
			TE_setisglobal(typeCode);
			break;

		case TE_local:
			TE_setislocal(typeCode);
			break;

		case TE_guard:
			TE_setisguard(typeCode);
			break;

		case TE_vftable:
			TE_setisvftable(typeCode);
			break;

		case TE_vbtable:
			TE_setisvbtable(typeCode);
			break;

		case TE_metatype:
			TE_setismetaclass(typeCode);
			break;

		default:
			TE_setisbadtype(typeCode);

			return typeCode;

		}	// End of SWITCH
	}	// End of else if then
	else if(*gName == TE_clinkage)
	{
		increment_buffer_no_check();

		TE_setisCident(typeCode);
	}
	else if (*gName == TE_structured_binding)
	{
		increment_buffer_no_check();
		TE_setisstructuredbinding(typeCode);
	}
	else if(*gName)
		TE_setisbadtype(typeCode);
	else
		TE_setistruncated(typeCode);

	//	Return the composed type code

	return typeCode;

}	// End of "UnDecorator" FUNCTION "getTypeEncoding"



DName UnDecorator::getBasedType(void)
{
	DName basedDecl(this, UScore(TOK_basedLp));


	//	What type of 'based' is it ?

	switch (get_current_character_and_increment_buffer())
	{
	case BT_void:
		basedDecl += "void"_l;
		break;

	case BT_nearptr:
		basedDecl += getScopedName();
		break;

	case BT_basedptr:
		//
		// Note: based pointer on based pointer is reserved
		//
		return DName(this, DN_invalid);

	case 0:
		basedDecl += DN_truncated;
		break;
	}	// End of SWITCH

	//	Close the based syntax

	basedDecl += ") "_l;

	//	Return completed based declaration

	return basedDecl;

}	// End of "UnDecorator" FUNCTION "getBasedType"



DName UnDecorator::getScopedName(void)
{
	DName scopeName(this);


	//	Get the beginning of the name

	scopeName = getZName(true);

	//	Now the scope (if any)

	if ((scopeName.status() == DN_valid) && *gName && (*gName != '@'))
		scopeName = getScope() + "::"_l + scopeName;

	//	Skip the trailing '@'

	if (*gName == '@')
		increment_buffer_no_check();
	else if(*gName)
		scopeName = DN_invalid;
	else if(scopeName.isEmpty())
		scopeName = DN_truncated;
	else
		scopeName = DName(this, DN_truncated) + "::"_l + scopeName;

	//	And return the complete name

	return scopeName;

}	// End of "UnDecorator" FUNCTION "getECSUName"

inline DName UnDecorator::getECSUName()
{
	return getScopedName();
}

inline DName UnDecorator::getEnumType(void)
{
	DName ecsuName(this);


	if (*gName)
	{
		//	What type of an 'enum' is it ?

		switch (*gName)
		{
		case ET_schar:
		case ET_uchar:
			ecsuName = "char "_l;
			break;

		case ET_sshort:
		case ET_ushort:
			ecsuName = "short "_l;
			break;

		case ET_sint:
			break;

		case ET_uint:
			ecsuName = "int "_l;
			break;

		case ET_slong:
		case ET_ulong:
			ecsuName = "long "_l;
			break;

		default:
			return DName(this, DN_invalid);
		}	// End of SWITCH

		//	Add the 'unsigned'ness if appropriate

		switch (*gName)
		{
		case ET_uchar:
		case ET_ushort:
		case ET_uint:
		case ET_ulong:
			ecsuName = "unsigned "_l + ecsuName;
			break;
		}	// End of SWITCH

		increment_buffer_no_check();

		//	Now return the composed name

		return ecsuName;

	}	// End of IF then
	else
		return DName(this, DN_truncated);

}	// End of "UnDecorator" FUNCTION "getEnumType"



DName UnDecorator::getCallingConvention(void)
{
	if (*gName)
	{
		unsigned int callCode = ((unsigned int)*gName) - 'A';
		increment_buffer_no_check();

		//	What is the primary calling convention

		DASSERT(CC_cdecl == 0);

		if (/*( callCode >= CC_cdecl ) &&*/(callCode <= CC_last))
		{
			DName callType(this, DN_invalid);

			//	Now, what type of 'calling-convention' is it, 'interrupt' is special ?
			switch (callCode & ~CC_saveregs)
			{
			case CC_cdecl:
				callType = UScore(TOK_cdecl);
				break;

			case CC_thiscall:
				callType = UScore(TOK_thiscall);
				break;

			case CC_stdcall:
				callType = UScore(TOK_stdcall);
				break;

			case CC_fastcall:
				callType = UScore(TOK_fastcall);
				break;

			// FIXME: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2400776
			case CC_vectorcall:
				callType = UScore(TOK_vectorcall);
				break;

			case CC_preserve_none:
				callType = UScore(TOK_preserve_none);
				break;

			case CC_cocall:
				callType = UScore(TOK_cocall);
				break;

			case CC_eabi:
				callType = UScore(TOK_eabi);
				break;

			case CC_swift_1:
				callType = UScore(TOK_swift_1);
				break;

			case CC_swift_2:
				callType = UScore(TOK_swift_2);
				break;

			case CC_swift_3:
				callType = UScore(TOK_swift_3);
				break;
			}	// End of SWITCH

			//	And return

			return callType;

		}	// End of IF then
		else
			return DName(this, DN_invalid);

	}	// End of IF then
	else
		return DName(this, DN_truncated);

}	// End of "UnDecorator" FUNCTION "getCallingConvention"



DName UnDecorator::getReturnType(DName * pDeclarator)
{
	if (*gName == '@')	// Return type for constructors and destructors ?
	{
		increment_buffer_no_check();

		return DName(this, pDeclarator);

	}	// End of IF then
	else
		return getDataType(pDeclarator);

}	// End of "UnDecorator" FUNCTION "getReturnType"



DName UnDecorator::getDataType(DName * pDeclarator)
{
	DName superType(this, pDeclarator);


	//	What type is it ?

	switch (*gName)
	{
	case 0:
		return (DN_truncated + superType);

	case BDT_void:
		increment_buffer_no_check();

		if (superType.isEmpty())
			return DName(this, "void"_l);
		else
			return "void "_l + superType;

	case '?':
	{

		increment_buffer_no_check();	// Skip the '?'

		superType = getDataIndirectType(superType, IndirectionKind::None, DName(this), 0);
		return getPrimaryDataType(superType);

	}	// End of CASE '?'

	default:
		return getPrimaryDataType(superType);

	}	// End of SWITCH
}	// End of "UnDecorator" FUNCTION "getDataType"



DName UnDecorator::getPrimaryDataType(const DName & superType)
{
	DName cvType(this);


	switch (*gName)
	{
	case 0:
		return (DN_truncated + superType);

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
	case PDT_volatileReference:
		if (!superType.isEmpty())
		{
			cvType = "volatile "_l;
		}
		else
		{
			cvType = "volatile"_l;
		}
		[[fallthrough]];
#endif

	case PDT_reference:
	{
		DName superName(superType);

		increment_buffer_no_check();

		return getReferenceType(cvType, superName.setPtrRef(), IndirectionKind::LvalueReference);

	}	// End of CASE 'PDT_reference'

	case PDT_extend:
	{
		//
		// Extended Primary Data Type (items overlooked in original design):
		// prefixed by '$$'.
		//
		if (gName[1] != PDT_extend)
			if (gName[1] == '\0')
				return DN_truncated + superType;
			else
				return DName(this, DN_invalid);

		increment_buffer_no_check(2);

		switch (*gName)
		{
		case PDT_ex_function:
			increment_buffer_no_check();
			return getFunctionIndirectType(superType);

		case PDT_ex_other:
			increment_buffer_no_check();
			return getPtrRefDataType(superType, /* isPtr = */ TRUE);

		case PDT_ex_qualified:
		{
			increment_buffer_no_check();

			return getBasicDataType(getDataIndirectType(superType, IndirectionKind::None, DName(this), 0));
		}
		break;

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
		case PDT_ex_vol_rvalue_ref:
			if (!superType.isEmpty())
			{
				cvType = "volatile "_l;
			}
			else
			{
				cvType = "volatile"_l;
			}
			[[fallthrough]];
#endif

		case PDT_ex_rvalue_ref:
		{
			DName superName(superType);

			increment_buffer_no_check();

			return getReferenceType(cvType, superName.setPtrRef(), IndirectionKind::RvalueReference);
		}

		case PDT_ex_nullptr:
			increment_buffer_no_check();
			return DName(this, DN_invalid);
			break;

		case PDT_ex_nullptr_t:
			increment_buffer_no_check();

			if (!superType.isEmpty())
			{
				return "std::nullptr_t "_l + superType;
			}
			else
			{
				return DName(this, "std::nullptr_t"_l);
			}
			break;

		case PDT_aliasTemplate:
			increment_buffer_no_check();
			return getScopedName();

		case PDT_empty:
			// This is the representation of a variadic type that was expanded to nothing so just return whatever the
			// super-type is
			increment_buffer_no_check();
			return superType;

		case 0:
			return (DN_truncated + superType);

		default:
			return DName(this, DN_invalid);
		}
	}

	default:
		return getBasicDataType(superType);

	}	// End of SWITCH
}	// End of "UnDecorator" FUNCTION "getPrimaryDataType"



DName UnDecorator::getArgumentTypes(void)
{
	switch (*gName)
	{
	case AT_ellipsis:
		increment_buffer_no_check();
		return DName(this, doEllipsis() ? "..."_l : UNDNAME_ELLIPSIS_ALTERNATE_STRINGLITERAL_1);

	case AT_void:
		increment_buffer_no_check();
		return DName(this, "void"_l);

	default:
	{
		DName arguments(getArgumentList());


		//	Now, is it a varargs function or not ?

		if (arguments.status() == DN_valid)
			switch (*gName)
			{
			case 0:
				return arguments;

			case AT_ellipsis:
				increment_buffer_no_check();
				return DName(arguments + (doEllipsis() ? ",..."_l : UNDNAME_ELLIPSIS_ALTERNATE_STRINGLITERAL_2));

			case AT_endoflist:
				increment_buffer_no_check();
				return arguments;

			default:
				return DName(this, DN_invalid);

			}	// End of SWITCH
		else
			return arguments;

	}	// End of DEFAULT
	}	// End of SWITCH
}	// End of "UnDecorator" FUNCTION "getArgumentTypes"


DName UnDecorator::getArgumentList(void)
{
	int first = TRUE;
	DName aList(this);


	while ((aList.status() == DN_valid) && (*gName != AT_endoflist) && (*gName != AT_ellipsis))
	{
		//	Insert the argument list separator if not the first argument

		if (first)
			first = FALSE;
		else
			aList += ',';


		//	Get the individual argument type

		if (*gName)
		{
			int argIndex = *gName - '0';


			//	Handle 'argument-replicators', otherwise a new argument type

			if ((argIndex >= 0) && (argIndex <= 9))
			{
				increment_buffer_no_check();	// Skip past the replicator

				//	Append to the argument list

				aList += (*pArgList)[argIndex];

			}	// End of IF then
			else
			{
				pcchar_t oldGName = gName;


				//	Extract the 'argument' type

				DName arg(getPrimaryDataType(DName(this)));


				//	Add it to the current list of 'argument's, if it is bigger than a one byte encoding

				if (((gName - oldGName) > 1) && !pArgList->isFull())
					*pArgList += arg;

				//	Append to the argument list

				aList += arg;

#if 1
				if (gName == oldGName)	// prevent endless loop on invalid input
					aList = DN_invalid;
#endif

			}	// End of IF else
		}	// End of IF then
		else
		{
			aList += DN_truncated;

			break;

		}	// End of IF else
	}	// End of WHILE

	//	Return the completed argument list

	return aList;

}	// End of "UnDecorator" FUNCTION "getArgumentList"


DName UnDecorator::getThrowTypes(void)
{
	// Handle the 'throw types'. This should never have been part of the name encoding at
	// all -- dynamic exception specifications were never part of a function type -- but someone
	// long ago decided that this was a good idea and we're stuck with it.
	//
	// For C++17 noexcept function encodings, for those functions where noexcept *is* encoded
	// on the type, we will not emit the ellipsis. In this case we will undecorate nothing here.
	// Top-level noexcept functions still have the ellipsis encoded, however, to maintain
	// ABI compatibility with C++14 and earlier code.
	if (*gName == AT_ellipsis)
	{
		increment_buffer_no_check();
	}

	return DName(this);
}	// End of "UnDecorator" FUNCTION "getThrowTypes"

DName UnDecorator::getNoexcept()
{
	if (*gName == '_' && *(gName + 1) == FT_noexcept)
	{
		increment_buffer_no_check(2);
		return DName(this, " noexcept"_l);
	}

	return DName(this);
}

#if CC_RESTRICTION_SPEC
DName UnDecorator::getRestrictionSpec(void)
{
	if (*gName == '_' && *(gName+1) && *(gName+1) <= 'D')
	{
		// Skip the escape char '_' first
		increment_buffer_no_check();

		unsigned int rstCode = ((unsigned int)*gName) - 'A';
		increment_buffer_no_check();

		if (rstCode <= RST_MASK)
		{
			DName restrictionMods(this);

			if (doMSKeywords())
			{
				restrictionMods += ' ';
				restrictionMods += UScore(TOK_restrictSpecLp);
				while (rstCode != 0)
				{
					unsigned int nextRstCode = (~rstCode + 1) & rstCode;
					switch (nextRstCode)
					{
					case RST_cpu:
						restrictionMods += "cpu"_l;
						break;
#if CC_DP_CXX
					case RST_amp:
						restrictionMods += "amp"_l;
						break;
#endif // CC_DP_CXX
					default:
						return DName(this, DN_invalid);
					}
					rstCode &= ~nextRstCode;
					if (rstCode != 0)
					{
						restrictionMods += ", "_l;
					}
				}
				restrictionMods += ')';
			}	// End of IF else

			return restrictionMods;

		}	// End of IF then
		else
			return DName(this, DN_invalid);

	}	// End of IF then
	else
		return DName(this);

}	// End of "UnDecorator" FUNCTION "getRestrictionSpec"

DName UnDecorator::getDispatchTarget(void)
{
	if (*gName == '_' && *(gName + 1) == '_')
	{
		// Skip the escape prefix '__' first
		increment_buffer_no_check(2);

		if (*gName == 0)
		{
			return DName(this, DN_truncated);
		}

		unsigned int rstCode = ((unsigned int)*gName) - 'A';
		increment_buffer_no_check();
		if (rstCode > RST_MASK)
		{
			// not a valid dispatch target
			return DName(this, DN_invalid);
		}

	}

	// dispatch target does not need to be undecorated since it's not part of the original function
	// signature. Just need to skip though it.
	return DName(this);
}
#endif // CC_RESTRICTION_SPEC

DName UnDecorator::getBasicDataType(const DName & superType)
{
	if (*gName)
	{
		unsigned char bdtCode = *gName;
		increment_buffer_no_check();

		unsigned char extended_bdtCode = 0x0;
		int pCvCode = -1;
		DName basicDataType(this);

		// The encoding is generated in 'NameEncoder_t::EncodeBasicDataType'. See
		//   src\vctools\Compiler\CxxFE\sl\p1\c\outdname.c

		// Extract the principal type information itself, and validate the codes

		switch (bdtCode)
		{
		case BDT_schar:
		case BDT_char:
		case (BDT_char | BDT_unsigned):
			basicDataType = "char"_l;
			break;

		case BDT_short:
		case (BDT_short | BDT_unsigned):
			basicDataType = "short"_l;
			break;

		case BDT_int:
		case (BDT_int | BDT_unsigned):
			basicDataType = "int"_l;
			break;

		case BDT_long:
		case (BDT_long | BDT_unsigned):
			basicDataType = "long"_l;
			break;

		case BDT_float:
			basicDataType = "float"_l;
			break;

		case BDT_longdouble:
			basicDataType = "long "_l;
			[[fallthrough]];

		case BDT_double:
			basicDataType += "double"_l;
			break;

		case BDT_pointer:
		case (BDT_pointer | BDT_const):
		case (BDT_pointer | BDT_volatile):
		case (BDT_pointer | BDT_const | BDT_volatile):
			pCvCode = (bdtCode & (BDT_const | BDT_volatile));
			break;
		case BDT_extend:
			switch (extended_bdtCode = get_current_character_and_increment_buffer())
			{
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
			case BDT_array:
				pCvCode = -2;
				break;
#endif
			case BDT_bool:
				basicDataType = "bool"_l;
				break;
			case BDT_int8:
			case (BDT_int8 | BDT_unsigned):
				basicDataType = "__int8"_l;
				break;
			case BDT_int16:
			case (BDT_int16 | BDT_unsigned):
				basicDataType = "__int16"_l;
				break;
			case BDT_int32:
			case (BDT_int32 | BDT_unsigned):
				basicDataType = "__int32"_l;
				break;
			case BDT_int64:
			case (BDT_int64 | BDT_unsigned):
				basicDataType = "__int64"_l;
				break;
			case BDT_int128:
			case (BDT_int128 | BDT_unsigned):
				basicDataType = "__int128"_l;
				break;
			case BDT_unknown:
				basicDataType = "<unknown>"_l;
				break;
			case BDT_char8_t:
				basicDataType = "char8_t"_l;
				break;
			case BDT_char16_t:
				basicDataType = "char16_t"_l;
				break;
			case BDT_char32_t:
				basicDataType = "char32_t"_l;
				break;
			case BDT_wchar_t:
				// So that we get diagnostics like we want them
				basicDataType = "wchar_t"_l;
				break;
			case BDT_auto:
				basicDataType = "auto"_l;
				break;
			case BDT_decltypeAuto:
				basicDataType = "decltype(auto)"_l;
				break;
			case BDT_explicit_object:
				basicDataType = "this "_l + getPrimaryDataType(superType);
				break;
#if CC_COR
			case BDT_coclass:
			case BDT_cointerface:
			{
				gName--;	// Backup, since 'ecsu-data-type' does it's own decoding

				basicDataType = getECSUDataType();

				if (basicDataType.isEmpty())
				{
					return basicDataType;
				}
			}
			break;
#endif // CC_COR
#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
			case '$':
				return "__w64 "_l + getBasicDataType(superType);
#endif

			case '\0':
				basicDataType = DN_truncated;
				break;

			default:
				basicDataType = "UNKNOWN"_l;
				break;
			}
			break;

		case BDT_void:
			basicDataType = "void"_l;
			break;

		default:
			gName--;	// Backup, since 'ecsu-data-type' does it's own decoding

			// It may be std::nullptr_t which has special decoration
			if ((gName[0] == PDT_extend) && (gName[1] == PDT_extend) && (gName[2] == PDT_ex_nullptr_t))
			{
				increment_buffer_no_check(3);

				basicDataType = "std::nullptr_t"_l;
			}
			else
			{
				basicDataType = getECSUDataType();

				if (basicDataType.isEmpty())
					return basicDataType;
			}
			break;

		}	// End of SWITCH

		//	What type of basic data type composition is involved ?

		if (pCvCode == -1)	// Simple ?
		{
			//	Determine the 'signed/unsigned'ness

			switch (bdtCode)
			{
			case (BDT_char | BDT_unsigned):
			case (BDT_short | BDT_unsigned):
			case (BDT_int | BDT_unsigned):
			case (BDT_long | BDT_unsigned):
				basicDataType = "unsigned "_l + basicDataType;
				break;

			case BDT_schar:
				basicDataType = "signed "_l + basicDataType;
				break;
			case BDT_extend:
				switch (extended_bdtCode)
				{

				case (BDT_int8 | BDT_unsigned):
				case (BDT_int16 | BDT_unsigned):
				case (BDT_int32 | BDT_unsigned):
				case (BDT_int64 | BDT_unsigned):
				case (BDT_int128 | BDT_unsigned):
					basicDataType = "unsigned "_l + basicDataType;
					break;

				}	// End of SWITCH
				break;
			}	// End of SWITCH

			// 	Add the indirection type to the type

			if (!superType.isEmpty())
				basicDataType += ' ' + superType;

			//	And return the completed type

			return basicDataType;

		}	// End of IF then
		else
		{
			DName cvType(this);
			DName superName(superType);

#ifndef TESTUNDN // the macro excludes names not generated by the current toolset
			if (pCvCode == -2)
			{
				superName.setIsArray();
				DName arType = getPointerTypeArray(cvType, superName);
				// if we didn't get back an array, append.
				// A multidimensional array sticks the braces in before the
				// other dimensions at sets isArray on it's return type.
				if (!arType.isArray())
				{
					arType += "[]"_l;
				}
				return arType;
			}
#endif

			//	Is it 'const/volatile' qualified ?

			if (superType.isEmpty())
			{
				//
				// const/volatile are redundantly encoded, except at the start
				// of a "type only" context.  In such a context, the super-type
				// is empty.
				//
				if (pCvCode & BDT_const)
				{
					cvType = "const"_l;

					if (pCvCode & BDT_volatile)
						cvType += " volatile"_l;
				}	// End of IF then
				else if(pCvCode & BDT_volatile)
					cvType = "volatile"_l;
			}	// End of IF then

			//	Construct the appropriate pointer type declaration

			return getPointerType(cvType, superName);

		}	// End of IF else
	}	// End of IF then
	else
		return (DN_truncated + superType);

}	// End of "UnDecorator" FUNCTION "getBasicDataType"



DName UnDecorator::getECSUDataType(void)
{
	//	Extract the principal type information itself, and validate the codes

	if (*gName == 0)
	{
		return DName(this, "`unknown ecsu'"_l) + DN_truncated;
	}

	DName ecsuDataType(this);

	int fPrefix;
	if (*gName == BDT_enum)
	{
		fPrefix = doEcsu();
	}
	else
	{
		fPrefix = doEcsu() && !doNameOnly();
	}

	if (fPrefix)
	{
		DName Prefix(this);

		switch (get_current_character_and_increment_buffer())
		{
		case BDT_union:
			Prefix = "union "_l;
			break;

		case BDT_struct:
			Prefix = "struct "_l;
			break;

		case BDT_class:
			Prefix = "class "_l;
			break;

#if CC_COR
		case BDT_coclass:
			Prefix = "coclass "_l;
			break;

		case BDT_cointerface:
			Prefix = "cointerface "_l;
			break;
#endif // CC_COR

		case BDT_enum:
			Prefix = "enum "_l + getEnumType();
			break;

		case 0:
			return DName(this, DN_truncated);
		}	// End of SWITCH

		ecsuDataType = Prefix;
	}
	else
	{
		char c = *gName;
		if (c == 0)
		{
			return DName(this, DN_truncated);
		}

		increment_buffer_no_check();

		// We don't need to output the prefix, but we still need to
		// skip the corresponding characters
		if (c == BDT_enum)
		{
			// Skip the characters for the underlying type
			getEnumType();
		}
	}

	//	Get the 'class/struct/union' name

	ecsuDataType += getECSUName();

	//	And return the formed 'ecsu-data-type'

	return ecsuDataType;

}	// End of "UnDecorator" FUNCTION "getECSUDataType"


//
// Undecorator::getFunctionIndirectType
//
//	Note: this function gets both the function-indirect-type and the function-type.
//
DName UnDecorator::getFunctionIndirectType(const DName & superType)
{
	if (!*gName)
		return DN_truncated + superType;

	if (!IT_isfunction(*gName))
		return DName(this, DN_invalid);


	int fitCode = *gName - '6';
	increment_buffer_no_check();

	if (fitCode == ('_' - '6'))
	{
		if (*gName)
		{
			fitCode = *gName - 'A' + FIT_based;
			increment_buffer_no_check();

			if ((fitCode < FIT_based) || (fitCode > (FIT_based | FIT_far | FIT_member)))
				fitCode = -1;

		}	// End of IF then
		else
			return (DN_truncated + superType);

	}	// End of IF then
	else if((fitCode < FIT_near) || (fitCode > (FIT_far | FIT_member)))
		fitCode = -1;

	//	Return if invalid name

	if (fitCode == -1)
		return DName(this, DN_invalid);


	//	Otherwise, what are the function indirect attributes

	DName thisType(this);
	DName fitType = superType;

	//	Is it a pointer to member function ?

	if (fitCode & FIT_member)
	{
		if (*gName != '@')
		{
			fitType = "::"_l + fitType;

			if (*gName)
				fitType = ' ' + getScope() + fitType;
			else
				fitType = DN_truncated + fitType;
		}
		else
		{
			// Pseudo this pointer
			increment_buffer_no_check();
		}

		if (*gName)
			if (*gName == '@')
				increment_buffer_no_check();
			else
				return DName(this, DN_invalid);
		else
			return (DN_truncated + fitType);

		if (doThisTypes())
			thisType = getThisType();
		else
			thisType |= getThisType();

	}	// End of IF

	//	Is it a based allocated function ?

	if (fitCode & FIT_based)
		if (doMSKeywords())
			fitType = ' ' + getBasedType() + fitType;
		else
			fitType |= getBasedType();	// Just lose the 'based-type'

	//	Get the 'calling-convention'

	if (doMSKeywords())
	{
		fitType = getCallingConvention() + fitType;
	}	// End of IF then
	else
		fitType |= getCallingConvention();	// Just lose the 'calling-convention'

	//	Parenthesize the indirection component, and work on the rest

	if (!superType.isEmpty())
	{
		fitType = '(' + fitType + ')';
	}

	//	Get the rest of the 'function-type' pieces

	DName *	pDeclarator = gnew DName(this);
	DName returnType(getReturnType(pDeclarator));

	fitType += '(' + getArgumentTypes() + ')';

	if (doThisTypes() && (fitCode & FIT_member))
		fitType += thisType;

	// See the note in outdname.c EncodeFunctionTypes for the structure of optional
	// flags that can appear after the argument list in a function type.

#if CC_RESTRICTION_SPEC
	if (doRestrictionSpec())
		fitType += getRestrictionSpec();
	else
		fitType |= getRestrictionSpec();	// Just lose the 'restriction specification'
#endif // CC_RESTRICTION_SPEC

	// If the name encoded noexcept on a function pointer, emit it unconditionally. Only code
	// compiled with -std:c++17 or later will encode these.
	fitType += getNoexcept();

	if (doThrowTypes())
		fitType += getThrowTypes();
	else
		fitType |= getThrowTypes();	// Just lose the 'throw-types'


	//	Now insert the indirected declarator, catch the allocation failure here

	if (pDeclarator)
		*pDeclarator = fitType;
	else
		return DName(this, DN_error);

	//	And return the composed function type (now in 'returnType' )

	return returnType;
}


DName UnDecorator::getPtrRefType(const DName & cvType, const DName & superType, IndirectionKind kind)
{
	//	Doubles up as 'pointer-type' and 'reference-type'
	StringLiteral ptrChar = IndirectionName[static_cast<int>(kind)];

	if (*gName)
		if (IT_isfunction(*gName))	// Is it a function or data indirection ?
		{
			DName fitType(this, ptrChar);


			if (!cvType.isEmpty() && (superType.isEmpty() || !superType.isPtrRef()))
				fitType += cvType;

			if (!superType.isEmpty())
				fitType += superType;

			return getFunctionIndirectType(fitType);
		}	// End of IF then
		else
		{
			//	Otherwise, it is either a pointer or a reference to some data type

			DName innerType(getDataIndirectType(superType, kind, cvType));

			return getPtrRefDataType(innerType, kind == IndirectionKind::Pointer);
		}	// End of IF else
	else
	{
		DName trunk(this, DN_truncated);


		trunk += ptrChar;

		if (!cvType.isEmpty())
			trunk += cvType;

		if (!superType.isEmpty())
		{
			if (!cvType.isEmpty())
				trunk += ' ';

			trunk += superType;

		}	// End of IF

		return trunk;

	}	// End of IF else
}	// End of "UnDecorator" FUNCTION "getPtrRefType"


DName UnDecorator::getExtendedDataIndirectType(IndirectionKind& kind, bool& fIsPinPtr, int thisFlag)
{
	DName szComPlusIndirSpecifier(this);

	DASSERT(*gName == '$');

	increment_buffer_no_check();	// swallow up the dollar

	switch (*gName)
	{
	case DIT_GCPointer:
		// Don't print ^ if we're undecorating the 'this' pointer
		if (!thisFlag)
		{
			if (kind == IndirectionKind::LvalueReference || kind == IndirectionKind::RvalueReference)
			{
				kind = IndirectionKind::Percent;
			}
			else if (kind == IndirectionKind::Pointer)
			{
				kind = IndirectionKind::Handle;
			}
		}
		increment_buffer_no_check();
		break;

	case DIT_PinPointer:
		// DASSERT(!thisFlag);	// validate, don't assert
		if (thisFlag)
			return DName(this, DN_invalid);

		fIsPinPtr = true;
		increment_buffer_no_check();
		break;

	case DIT_InteriorPointer:
		// this pointer of value class is interior_ptr
		kind = IndirectionKind::Percent;
		increment_buffer_no_check();
		break;

	default:
		if (!gName[0] || !gName[1])
			return DName(this, DN_truncated);
		// DASSERT(!thisFlag);	// validate, don't assert
		if (thisFlag)
			return DName(this, DN_invalid);

		unsigned int nRank = ((gName[0] - '0') << 4) + (gName[1] - '0');
		increment_buffer_no_check(2);

		if (nRank > 1)
		{
			szComPlusIndirSpecifier = ',';
			szComPlusIndirSpecifier = szComPlusIndirSpecifier + DName(this, (unsigned __int64)nRank);
		}

		szComPlusIndirSpecifier = szComPlusIndirSpecifier + '>';

		if (*gName == '$')
		{
			// Skip the "incomplete" com array marker.  There is no
			// way to express this construct in the old syntax.  In
			// the new syntax, this tells us the difference between:
			//
			//      array<int>^
			// and: array<int>

			increment_buffer_no_check();
		}
		else
		{
			szComPlusIndirSpecifier = szComPlusIndirSpecifier + '^';
		}

		// Skip the encoding for the 64-bit pointer (DIT_ptr64)
		if (*gName == 'E')
		{
			if (doMSKeywords() && doPtr64())
			{
				szComPlusIndirSpecifier = szComPlusIndirSpecifier + ' ' + UScore(TOK_ptr64);
			}
			increment_buffer_no_check();
		}

		// Skip the encoding for the indirected type ('A')
		if (*gName)
		{
			increment_buffer_no_check();
		}
		else
		{
			szComPlusIndirSpecifier += DN_truncated;
		}

		szComPlusIndirSpecifier.setIsComArray();

		return szComPlusIndirSpecifier;
	}

	return DName(this);
}

DName UnDecorator::getDataIndirectType(const DName & superType, IndirectionKind kind, const DName & cvType, int thisFlag)
{
	DName szComPlusIndirSpecifier(this);
	bool bIsPinPtr = false;

	if (*gName)
	{
		if (gName[0] == '$')
		{
			DName result = getExtendedDataIndirectType(kind, bIsPinPtr, thisFlag);

			if (!result.isEmpty())
			{
				return result;
			}
		}

		unsigned int ditCode = (*gName - ((*gName >= 'A') ? (unsigned int)'A' : (unsigned int)('0' - 26)));

		DName msExtension(this);
		DName msExtensionPre(this);

		int fContinue = TRUE;
		bool isLrefQualifier = false;
		bool isRrefQualifier = false;
		do
		{
			switch (ditCode)
			{
			case DIT_ptr64:
				if (doMSKeywords() && doPtr64())
				{
					if (!msExtension.isEmpty())
						msExtension = msExtension + ' ' + UScore(TOK_ptr64);
					else
						msExtension = UScore(TOK_ptr64);
				}
				break;
			case DIT_unaligned:
				if (doMSKeywords())
				{
					if (!msExtensionPre.isEmpty())
						msExtensionPre = msExtensionPre + ' ' + UScore(TOK_unaligned);
					else
						msExtensionPre = UScore(TOK_unaligned);
				}
				break;
			case DIT_restrict:
				if (doMSKeywords())
				{
					if (!msExtension.isEmpty())
						msExtension = msExtension + ' ' + UScore(TOK_restrict);
					else
						msExtension = UScore(TOK_restrict);
				}
				break;
			case DIT_lref:
				if (!thisFlag)
				{
					return DName(this, DN_invalid);
				}
				isLrefQualifier = true;
				break;
			case DIT_rref:
				if (!thisFlag)
				{
					return DName(this, DN_invalid);
				}
				isRrefQualifier = true;
				break;

			default:
				fContinue = FALSE;
				break;
			}

			if (fContinue)
			{
				increment_buffer_no_check();

				if (*gName == 0)
				{
					return DName(this, DN_truncated);
				}

				if (gName[0] == '$')
				{
					DName result = getExtendedDataIndirectType(kind, bIsPinPtr, thisFlag);

					if (!result.isEmpty())
					{
						return result;
					}
				}

				ditCode = (*gName - ((*gName >= 'A') ? (unsigned int)'A' : (unsigned int)('0' - 26)));
			}
		} while (fContinue);

		if (*gName)
			increment_buffer_no_check();		// Skip to next character in name

		//	Is it a valid 'data-indirection-type' ?

		DASSERT(DIT_near == 0);
		if ((ditCode <= (DIT_const | DIT_volatile | DIT_modelmask | DIT_member)))
		{
			StringLiteral prType = IndirectionName[static_cast<int>(kind)];

			DName ditType(this, prType);

			ditType = szComPlusIndirSpecifier + ditType;

			if (!msExtension.isEmpty())
				ditType = ditType + ' ' + msExtension;

			if (!msExtensionPre.isEmpty())
				ditType = msExtensionPre + ' ' + ditType;

			//	If it is a member, then these attributes immediately precede the indirection token

			if (ditCode & DIT_member)
			{
				//	If it is really 'this-type', then it cannot be any form of pointer to member

				if (thisFlag)
					return DName(this, DN_invalid);

				//	Otherwise, extract the scope for the PM

				if (prType.len > 0)
				{
					ditType = "::"_l + ditType;

					if (*gName)
						ditType = getScope() + ditType;
					else
						ditType = DN_truncated + ditType;
				}
				else if(*gName)
				{
					//
					// The scope is ignored for special uses of data-indirect-type, such
					// as storage-convention.  I think it's a bug that we ever mark things
					// with Member storage convention, as that is already covered in the
					// scope of the name.  However, we don't want to change the dname scheme,
					// so we're stuck with it.
					//
					ditType |= getScope();
				}

				//	Now skip the scope terminator

				char c = get_current_character_and_increment_buffer();
				if (!c)
					ditType += DN_truncated;
				else if (c != '@')
					return DName(this, DN_invalid);

			}	// End of IF

			//	Add the 'model' attributes (prefixed) as appropriate

			if (doMSKeywords())
			{
				switch (ditCode & DIT_modelmask)
				{
				case DIT_based:
					//	The 'this-type' can never be 'based'

					if (thisFlag)
						return DName(this, DN_invalid);

					ditType = getBasedType() + ditType;
					break;

				}	// End of SWITCH
			}	// End of IF
			else if((ditCode & DIT_modelmask) == DIT_based)
				ditType |= getBasedType();	// Just lose the 'based-type'

			//	Handle the 'const' and 'volatile' attributes

			if (ditCode & DIT_volatile)
				ditType = "volatile "_l + ditType;

			if (ditCode & DIT_const)
				ditType = "const "_l + ditType;

			if (isLrefQualifier)
				ditType = ditType + "& "_l;

			if (isRrefQualifier)
				ditType = ditType + "&& "_l;

			//	Append the supertype, if not 'this-type'

			if (!thisFlag)
				if (!superType.isEmpty())
				{
					//	Is the super context included 'cv' information, ensure that it is added appropriately

					if (superType.isPtrRef() || cvType.isEmpty())
						if (superType.isArray())
							ditType = superType;	// array type, skip space
						else
							ditType += ' ' + superType;
					else
						ditType += ' ' + cvType + ' ' + superType;

				}	// End of IF then
			else if(!cvType.isEmpty())
				ditType += ' ' + cvType;

			if (bIsPinPtr)
			{
				// 'cli::pin_ptr' is internally represented as 'T * [__ptr64] volatile'.
				// We want to show 'cli::pin_ptr<T>' instead of 'T * [__ptr64] volatile'.
				ditType = '>';
				ditType.setIsPinPtr();
			}

			//	Make sure qualifiers aren't re-applied
			ditType.setPtrRef();

			//	Finally, return the composed 'data-indirection-type' (with embedded sub-type)

			return ditType;

		}	// End of IF then
		else
			return DName(this, DN_invalid);

	}	// End of IF then
	else if(!thisFlag && !superType.isEmpty())
	{
		//	Is the super context included 'cv' information, ensure that it is added appropriately

		if (superType.isPtrRef() || cvType.isEmpty())
			return (DN_truncated + superType);
		else
			return (DN_truncated + cvType + ' ' + superType);

	}	// End of else if then
	else if(!thisFlag && !cvType.isEmpty())
		return (DN_truncated + cvType);
	else
		return DName(this, DN_truncated);

}	// End of "UnDecorator" FUNCTION "getDataIndirectType"


DName UnDecorator::getPtrRefDataType(const DName& superType, int isPtr)
{
	// Doubles up as 'pointer-data-type' and 'reference-data-type'
	if (*gName != '\0')
	{
		// Is this a 'pointer-data-type'?
		if (isPtr)
		{
			if (*gName == PoDT_void)
			{
				increment_buffer_no_check();	// Skip this character

				if (superType.isEmpty())
				{
					return DName(this, "void"_l);
				}

				return "void "_l + superType;
			}

			// If this is the encoding for a boxed type then skip over it and continue with the underlying type
			if ((gName[0] == BDT_extend) && (gName[1] == BDT_extend) && (gName[2] == BDT_boxed))
			{
				increment_buffer_no_check(3);
			}
		}

		// Otherwise it may be std::nullptr_t which has special decoration
		if ((gName[0] == PDT_extend) && (gName[1] == PDT_extend) && (gName[2] == PDT_ex_nullptr_t))
		{
			increment_buffer_no_check(3);
			if (superType.isEmpty())
			{
				return DName(this, "std::nullptr_t"_l);
			}
			else
			{
				return "std::nullptr_t "_l + superType;
			}
		}

		// Otherwise it may be a 'reference-data-type'
		if (*gName == RDT_array)	// An array ?
		{
			increment_buffer_no_check();
			return getArrayType(superType);
		}

		// Otherwise, it is a 'basic-data-type'
		DName bdt = getBasicDataType(superType);
		if (superType.isComArray())
		{
			bdt = "cli::array<"_l + bdt;
		}
		else if (superType.isPinPtr())
		{
			bdt = "cli::pin_ptr<"_l + bdt;
		}

		return bdt;
	}
	else
	{
		return(DN_truncated + superType);
	}
}


inline DName UnDecorator::getArrayType(const DName & superType)
{
	if (*gName)
	{
		int noDimensions = getNumberOfDimensions();

		if (noDimensions < 0)
			noDimensions = 0;

		if (!noDimensions)
			return getBasicDataType(DName(this, '[') + DN_truncated + ']');
		else
		{
			DName arrayType(this);

			if (superType.isArray())
			{
				arrayType += "[]"_l;
			}

			while (arrayType.isValid() && noDimensions-- && *gName)
				arrayType += '[' + getDimension() + ']';

			//	If it is indirect, then parenthesize the 'super-type'

			if (!superType.isEmpty())
				if (superType.isArray())
					arrayType = superType + arrayType;
				else
					arrayType = '(' + superType + ')' + arrayType;

			//	Return the finished array dimension information

			DName newType = getPrimaryDataType(arrayType);
			newType.setIsArray();
			return newType;

		}	// End of IF else
	}	// End of IF
	else if(!superType.isEmpty())
		return getBasicDataType('(' + superType + ")["_l + DN_truncated + ']');
	else
		return getBasicDataType(DName(this, '[') + DN_truncated + ']');

}	// End of "UnDecorator" FUNCTION "getArrayType"


inline DName UnDecorator::getLexicalFrame(void) { return '`' + getDimension() + '\''; }
inline DName UnDecorator::getStorageConvention(void) { return getDataIndirectType(); }


inline DName UnDecorator::getDataIndirectType()
{
	return getDataIndirectType(DName(this), IndirectionKind::None, DName(this));
}

inline DName UnDecorator::getThisType()
{
	return getDataIndirectType(DName(this), IndirectionKind::None, DName(this), TRUE);
}

inline DName UnDecorator::getPointerType(const DName& cv, const DName& superType)
{
	return getPtrRefType(cv, superType, IndirectionKind::Pointer);
}

inline DName UnDecorator::getPointerTypeArray(const DName& cv, const DName& superType)
{
	return getPtrRefType(cv, superType, IndirectionKind::None);
}

inline DName UnDecorator::getReferenceType(const DName& cv, const DName& superType, IndirectionKind kind)
{
	return getPtrRefType(cv, superType, kind);
}

inline DName UnDecorator::getSegmentName(void) { return getZName(true); }

inline DName UnDecorator::getDisplacement(void) { return getDimension(true); }
inline DName UnDecorator::getCallIndex(void) { return getDimension(); }
inline DName UnDecorator::getGuardNumber(void) { return getDimension(); }

inline DName UnDecorator::getVbTableType(const DName & superType)
{
	return getVfTableType(superType);
}


inline DName UnDecorator::getVCallThunkType(void)
{
	switch (*gName)
	{
	case VMT_nTnCnV:
		increment_buffer_no_check();
		return DName(this, "{flat}"_l);
	case 0:
		return DName(this, DN_truncated);
	default:
		return DName(this, DN_invalid);
	}
}	// End of "UnDecorator" FUNCTION "getVCallThunk"


inline DName UnDecorator::getVfTableType(const DName & superType)
{
	DName vxTableName = superType;


	if (vxTableName.isValid() && *gName)
	{
		vxTableName = getStorageConvention() + ' ' + vxTableName;

		if (vxTableName.isValid())
		{
			if (*gName != '@')
			{
				vxTableName += "{for "_l;

				while (vxTableName.isValid() && *gName && (*gName != '@'))
				{
					vxTableName += '`' + getScope() + '\'';

					//	Skip the scope delimiter

					if (*gName == '@')
						increment_buffer_no_check();

					//	Close the current scope, and add a conjunction for the next (if any)

					if (vxTableName.isValid() && (*gName != '@'))
						vxTableName += "s "_l;

				}	// End of WHILE

				if (vxTableName.isValid())
				{
					if (!*gName)
						vxTableName += DN_truncated;

					vxTableName += '}';

				}	// End of IF
			}	// End of IF

			//	Skip the 'vpath-name' terminator

			if (*gName == '@')
				increment_buffer_no_check();

		}	// End of IF
	}	// End of IF then
	else if(vxTableName.isValid())
		vxTableName = DN_truncated + vxTableName;

	return vxTableName;

}	//	End of "UnDecorator" FUNCTION "getVfTableType"


inline DName UnDecorator::getVdispMapType(const DName & superType)
{
	DName vdispMapName = superType;
	vdispMapName += "{for "_l;
	vdispMapName += getScope();
	vdispMapName += '}';

	if (*gName == '@')
		increment_buffer_no_check();
	return vdispMapName;
}


inline DName UnDecorator::getExternalDataType(const DName & superType)
{
	//	Create an indirect declarator for the rest

	DName *	pDeclarator = gnew DName(this);
	DName declaration = getDataType(pDeclarator);


	//	Now insert the declarator into the declaration along with its 'storage-convention'

	*pDeclarator = getStorageConvention() + ' ' + superType;

	return declaration;

}	//	End of "UnDecorator" FUNCTION "getExternalDataType"

inline int UnDecorator::doUnderScore() { return !(disableFlags & UNDNAME_NO_LEADING_UNDERSCORES); }
inline int UnDecorator::doMSKeywords() { return !(disableFlags & UNDNAME_NO_MS_KEYWORDS); }
inline int UnDecorator::doPtr64() { return !(disableFlags & UNDNAME_NO_PTR64); }
inline int UnDecorator::doFunctionReturns() { return !(disableFlags & UNDNAME_NO_FUNCTION_RETURNS); }
inline int UnDecorator::doAllocationModel() { return !(disableFlags & UNDNAME_NO_ALLOCATION_MODEL); }
inline int UnDecorator::doAllocationLanguage() { return !(disableFlags & UNDNAME_NO_ALLOCATION_LANGUAGE); }

inline int UnDecorator::doThisTypes() { return ((disableFlags & UNDNAME_NO_THISTYPE) != UNDNAME_NO_THISTYPE); }
inline int UnDecorator::doAccessSpecifiers() { return !(disableFlags & UNDNAME_NO_ACCESS_SPECIFIERS); }
inline int UnDecorator::doThrowTypes() { return !(disableFlags & UNDNAME_NO_THROW_SIGNATURES); }
inline int UnDecorator::doMemberTypes() { return !(disableFlags & UNDNAME_NO_MEMBER_TYPE); }
inline int UnDecorator::doReturnUDTModel() { return !(disableFlags & UNDNAME_NO_RETURN_UDT_MODEL); }

inline int UnDecorator::do32BitNear() { return !(disableFlags & UNDNAME_32_BIT_DECODE); }

inline int UnDecorator::doNameOnly() { return (disableFlags & UNDNAME_NAME_ONLY); }
inline int UnDecorator::doTypeOnly() { return (disableFlags & UNDNAME_TYPE_ONLY); }
inline int UnDecorator::haveTemplateParameters() { return (disableFlags & UNDNAME_HAVE_PARAMETERS); }
inline int UnDecorator::doEcsu() { return !(disableFlags & UNDNAME_NO_ECSU); }
inline int UnDecorator::doNoIdentCharCheck() { return (disableFlags & UNDNAME_NO_IDENT_CHAR_CHECK); }
inline int UnDecorator::doEllipsis() { return !(disableFlags & UNDNAME_NO_ELLIPSIS); }

#if CC_RESTRICTION_SPEC
inline int UnDecorator::doRestrictionSpec() { return !(disableFlags & UNDNAME_NO_RESTRICTION_SPEC); }
#endif // CC_RESTRICTION_SPEC

StringLiteral UnDecorator::UScore(Tokens tok)
{
	if (doUnderScore())
		return tokenTable[tok];
	else
		return tokenTable[tok] + 2;
}	// End of "UnDecorator" FUNCTION "UScore"


//	Include the string composition support classes.  Mostly inline stuff, and
//	not important to the algorithm.

#include "undname.inl"
