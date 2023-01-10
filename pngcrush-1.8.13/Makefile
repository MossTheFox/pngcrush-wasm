# Sample makefile for pngcrush using gcc and GNU make.
# Revised to build with INTEL_SSE2 and ARM_NEON support
# Glenn Randers-Pehrson
# Last modified:  3 October 2016
#
# Invoke this makefile from a shell prompt in the usual way; for example:
#
#	make -f Makefile [OPTIONS=-Dsomething]
#
# This makefile builds a statically linked executable, using the bundled
# libpng and zlib code.

# macros --------------------------------------------------------------------

# CC = gcc
# LD = $(CC)
CC = emcc
LD = $(CC)
RM = rm -f

# On some platforms you might need to comment this out:
CFLAGS += -std=c90 

CFLAGS += -O3 -funroll-loops -fomit-frame-pointer

# use unified libpng:
CPPFLAGS = -DLIBPNG_UNIFIED

CPPFLAGS += ${OPTIONS} -I.

# We don't need these:
CPPFLAGS += -DNO_GZ

# Enable high resolution timers:
CPPFLAGS += -DPNGCRUSH_TIMERS=11 -DPNGCRUSH_USE_CLOCK_GETTIME=1
# If you get a linking error with clock_gettime() you might need this:
# LIBS += -lrt

# Cannot use this with libpng15 and later.
# CPPFLAGS += -DINFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR

# EMSCRIPTEM compile flags
LDFLAGS = -s MODULARIZE=1 \
	-s EXPORT_NAME="createPngcrushModule" \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s INVOKE_RUN=0 \
	-s EXIT_RUNTIME=1 \
	-s EXPORTED_RUNTIME_METHODS="['FS', 'callMain']"\
	-O1

O = .o
E = .js

PNGCRUSH  = pngcrush

LIBS += -lm

# uncomment these 4 lines only if you are NOT using an external copy of zlib:
ZHDR = zlib.h
ZOBJS  = adler32$(O) compress$(O) crc32$(O) deflate$(O) \
	 infback$(O) inffast$(O) inflate$(O) inftrees$(O) \
	 trees$(O) uncompr$(O) zutil$(O)

# Enable ARM_NEON support
# CPPFLAGS += -DPNGCRUSH_USE_ARM_NEON
# Disable ARM_NEON support
# CPPFLAGS += -DPNG_ARM_NEON_OPT=0

# Enable MIPS-NSA support
# CPPFLAGS += -DPNGCRUSH_USE_MPS_MSA
# Disable MIPS-NSA support
# CPPFLAGS += -DPNG_MIPS_MSA_OPT=0

# Enable INTEL SSE support
# CPPFLAGS += -DPNGCRUSH_USE_INTEL_SSE -DPNG_INTEL_SSE
# Disable INTEL SSE support
# CPPFLAGS += -DPNG_INTEL_SSE_OPT=0

# Enable POWERPC_VSX support
# CPPFLAGS += -DPNGCRUSH_USE_POWERPC_VSX
# Disable POWERPC_VSX support
# CPPFLAGS += -DPNG_POWERPC_VSX_OPT=0

# unified libpng with separate zlib *.o
OBJS  = pngcrush$(O) $(ZOBJS)

EXES = $(PNGCRUSH)$(E)

# implicit make rules -------------------------------------------------------

.c$(O): png.h pngconf.h pngcrush.h cexcept.h pngpriv.h pnglibconf.h $(ZHDR)
	$(CC) -c $(CPPFLAGS) $(CFLAGS) $<


# dependencies --------------------------------------------------------------

all:  $(EXES)

deflate$(O): deflate.c
	$(CC) -c -DTOO_FAR=32767 $(CPPFLAGS) $(CFLAGS) $<

pngcrush$(O): pngcrush.c png.h pngconf.h pngcrush.h pnglibconf.h cexcept.h \
	$(ZHDR)
	$(CC) -c $(CPPFLAGS) $(CFLAGS) $<

$(PNGCRUSH)$(E): $(OBJS)
	$(LD) $(LDFLAGS) -o $@ $(OBJS) $(LIBS)

# maintenance ---------------------------------------------------------------

clean:
	$(RM) $(EXES) $(OBJS)
