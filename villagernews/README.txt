Villager News for DylanClient

Put this folder next to index.html on your site as "villagernews/". Villager News is listed under Fabric Mods (right shift
menu) and starts switched off. Nothing is downloaded until a player turns it on; then the client reads
villagernews/pack.json next to the page first, then /addons/villagernews/pack.json on the DylanClient relays and the
relays in the player's list, so single-file builds without this folder still work while a relay hosts it.

  pack.json     manifest the client reads (version, content key, file names)
  assets.zip    all sounds, textures, models, lang and item files (split into assets.zip.partN.dylan for hosts with file size limits)
  dialogs.json  voice line table, also read by the singleplayer server worker

The client downloads the assets once, keeps them in browser storage and downloads again only when "key" in
pack.json changes. Rebuild this folder with tools/release/make-villagernews.js.
All sounds, textures, models and animations belong to Oreville Studios and Element Animation (Villager News add-on).

