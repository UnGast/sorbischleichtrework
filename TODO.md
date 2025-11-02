- legacy pack builder should output to a dir outside of apps; and give the pack a name
- mock pack builder should not output a dir besides the zip
- internationalization (english UI)
- uplaod on iOS and Android too see how it goes
//- pack manager needs to handle hashes when downloading packs/when to download again and unpack again => specification for packet source?
- pack language versions
- perhaps make sorbian on top, german below in phrases
- for sorbian/enlgish i18n


- Maybe remote packs:
Soo now let's move on remote downloaded real packs; there should be a dev pack server (and dev pack server url configured....) and a url for production configured in the app;

then it should check there for a manifest flie that lists available packs and their locatios and hashes (so that it can check whether the local pack version is still current)

design the server, manfiest file and the download and updating approach and the in app UI for selecting a pack when the app starts as well as switching it later; => progress e.g. in vocab must be attached to a specific pack (because ids of items mitght be duplicate across packs)

the pack selection should show the language pair that is represented by this pack, not more 
the selectino screen should be shown on first start as well as in some settings screen


=> the pack selection should show the main pack that's bundled as well as the available downloadable packs... 
but it should be possible to disable remote pack selection