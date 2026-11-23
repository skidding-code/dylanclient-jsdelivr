Actions & Stuff for DylanClient

Put this folder next to index.html on your site as "actionandstuff/". Actions & Stuff is listed under Fabric Mods (right shift
menu) and starts switched off. Nothing is downloaded until a player turns it on; then the client reads
actionandstuff/pack.json next to the page first, then /addons/actionandstuff/pack.json on the DylanClient relays and the
relays in the player's list, so single-file builds without this folder still work while a relay hosts it.

  pack.json     manifest the client reads (version, content key, file names, optional resource packs)
  assets.zip    all models, animations, textures, sounds, particles and lang files (split into assets.zip.partN.dylan
                for hosts with file size limits)

assets.zip is a normal resource pack. It also holds two optional resource packs that the client lists in the
Resource Packs screen and turns on by default, like the Fabric mod does:
  resourcepacks/ans_textures  Actions & Stuff Textures (blocks, items, block entities, HUD)
  resourcepacks/ans_colors    Actions & Stuff Colors (grass and foliage colour maps)
and one that is listed but stays off unless the player turns it on:
  resourcepacks/ans_water     Actions & Stuff Clear Water (the lighter, more see-through water texture)

The client downloads the assets once, keeps them in browser storage and downloads again only when "key" in
pack.json changes. Rebuild this folder with tools/release/make-actionandstuff.js.

Credits
The Actions & Stuff resource pack is made by Oreville Studios. Every model, animation, texture, sound, particle
and pack text in this folder belongs to Oreville Studios. These assets are not part of DylanClient and are not
included in the client; they are only loaded from this folder. DylanClient is not affiliated with or endorsed
by Oreville Studios.
The client code that plays them is based on Actions & Stuff (Java Port) by ans-port contributors (MIT License)
running on GeckoLib by Tslat and contributors (MIT License).

