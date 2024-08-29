OAI_CHAT_STICKER = sticker.xml
OAI_CHAT_FILES	= \
	$(srcdir)/AUTHORS \
	$(srcdir)/index.html \
	$(srcdir)/sticker.xml \
	$(srcdir)/configure.ac \
	$(srcdir)/COPYING \
	$(srcdir)/COPYING.md \
	$(srcdir)/LICENSE.md \
	$(srcdir)/Makefile.am \
	$(srcdir)/vad_version \
	$(srcdir)/svg/*.* \
	$(srcdir)/js/*.js 
	$(srcdir)/lib/*.js \
	$(srcdir)/css/*.css 

NEED_VERSION=08.03.3329
VAD_VERSION=$(shell ./gen_version.sh)

vad_DATA = opal_assistant_skin_dav.vad

version.js: $(OAI_CHAT_FILES)
	@echo "vad_version='$(VAD_VERSION)';" > version.js

opal_assistant_skin_dav.vad: $(OAI_CHAT_FILES) $(OAI_CHAT_STICKER) Makefile vad_version version.js
	@PYTHON@ @VADPACKER@ -o opal_assistant_skin_dav.vad \
		--var="VERSION=$(VAD_VERSION)" \
		--var="BASE_PATH=/DAV/VAD" \
		--var="TYPE=dav" \
		--var="ISDAV=1" \
		--var="NEED_VERSION=$(NEED_VERSION)" \
		$(OAI_CHAT_STICKER)


CLEANFILES = *.vad

EXTRA_DIST = $(OAI_CHAT_FILES) $(OAI_CHAT_STICKER)
