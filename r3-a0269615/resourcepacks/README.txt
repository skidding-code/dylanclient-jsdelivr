DylanClient site resource packs

Put resource pack .zip files in these folders and every player who opens this site gets them:

  enabled/   packs that are switched on for everyone by default (players can still turn them off)
  optional/  packs that show up in Options > Resource Packs, switched off until a player turns them on

The client downloads each pack once and keeps it in browser storage, so later visits start instantly.
When you replace or remove a pack here, players get the change the next time they open the site.

packs.json lists the packs and their versions. It lets hosts that do not show folder listings
(GitHub Pages, jsDelivr, Cloudflare Pages, Netlify) find the packs. After adding or removing packs, run:

  node make-sitepacks.js resourcepacks

from the folder that holds resourcepacks/ (add --split for jsDelivr, which splits packs bigger than 19 MB).
Hosts that show folder listings (nginx autoindex, Apache, Caddy browse, python -m http.server) also pick up
packs that are missing from packs.json.

A pack whose license does not allow rehosting can be linked instead of copied: put a text file named
<pack>.zip.url next to the others with the https download address on its first line. Players then download
it straight from that address (the host must allow cross-origin downloads, as Modrinth and GitHub releases do).
