const fs = require('fs');
const path = require('path');

// Allow configuring the source host address via environment variable or command-line argument
const BASE_HOST = (process.env.MASTER_STRIKE_HOST || process.argv[2] || 'https://master-strike.com').replace(/\/+$/, '');

const publicIconsDir = path.join(__dirname, 'public', 'icons');
const distIconsDir = path.join(__dirname, 'dist', 'icons');

if (!fs.existsSync(publicIconsDir)) fs.mkdirSync(publicIconsDir, { recursive: true });
if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir, { recursive: true });

async function downloadAll() {
  const appJsUrl = `${BASE_HOST}/js/app.11c3eb2e.js`;
  console.log(`Fetching icon manifest from ${appJsUrl}...`);

  try {
    const res = await fetch(appJsUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch manifest (${res.status} ${res.statusText})`);
    }
    const text = await res.text();
    const matches = [...text.matchAll(/\"(img\/([^\.\"]+)\.([a-f0-9]+)\.svg)\"/g)];
    
    console.log(`Found ${matches.length} SVGs to download from ${BASE_HOST}`);

    for (const m of matches) {
      const fullUrl = `${BASE_HOST}/${m[1]}`;
      const name = m[2]; // e.g. 'tech', 'strength', 'recruit'
      const fileName = `${name}.svg`;
      
      try {
        const svgRes = await fetch(fullUrl);
        if (svgRes.ok) {
          const svgContent = await svgRes.text();
          fs.writeFileSync(path.join(publicIconsDir, fileName), svgContent);
          fs.writeFileSync(path.join(publicIconsDir, `${name}.${m[3]}.svg`), svgContent);
          
          fs.writeFileSync(path.join(distIconsDir, fileName), svgContent);
          fs.writeFileSync(path.join(distIconsDir, `${name}.${m[3]}.svg`), svgContent);
          console.log(`Downloaded ${fileName} (${svgContent.length} bytes)`);
        } else {
          console.error(`Failed to download ${fullUrl}: ${svgRes.status}`);
        }
      } catch (err) {
        console.error(`Error downloading ${fullUrl}:`, err.message);
      }
    }

    // Also create explicit aliases where naming might differ
    const aliases = {
      'shield': 'shield.82ff8fb0.svg',
      'x-men': 'x-men.55c6c309.svg',
      'xmen': 'x-men.55c6c309.svg',
      'heroes-of-asgard': 'heroes-of-asgard.e58bd546.svg',
      'heroesofasgard': 'heroes-of-asgard.e58bd546.svg',
      'champions': 'champions.fd4f3c37.svg',
      'fantastic-four': 'fantastic-four.64fa7ea8.svg',
      'ff': 'fantastic-four.64fa7ea8.svg',
      'guardians-of-the-galaxy': 'guardians-of-the-galaxy.45fe61dc.svg',
      'gotg': 'guardians-of-the-galaxy.45fe61dc.svg',
      'spider-friends': 'spider-friends.81b5bc1e.svg',
      'spiderfriends': 'spider-friends.81b5bc1e.svg',
      'marvel-knights': 'marvel-knights.2c767ffb.svg',
      'marvelknights': 'marvel-knights.2c767ffb.svg',
      'x-force': 'x-force.fbc7e389.svg',
      'xforce': 'x-force.fbc7e389.svg',
      'world-war-hulk': 'wwhulk.9755d608.svg',
      'wwhulk': 'wwhulk.9755d608.svg',
      'secret-wars-1': 'sw1.c853dc75.svg',
      'sw1': 'sw1.c853dc75.svg',
      'secret-wars-2': 'sw2.1b0a697f.svg',
      'sw2': 'sw2.1b0a697f.svg',
      'paint-the-town-red': 'pttr.44009840.svg',
      'pttr': 'pttr.44009840.svg',
      'midnight-sons': 'midnightsons.64f0945b.svg',
      'midnightsons': 'midnightsons.64f0945b.svg',
      'into-the-cosmos': 'intothecosmos.3e9f1724.svg',
      'intothecosmos': 'intothecosmos.3e9f1724.svg',
      'realm-of-kings': 'realmofkings.6eb7a6b6.svg',
      'realmofkings': 'realmofkings.6eb7a6b6.svg',
      'spider-man-homecoming': 'spiderhomecoming.4f48af30.svg',
      'spiderhomecoming': 'spiderhomecoming.4f48af30.svg',
    };

    for (const [alias, srcFile] of Object.entries(aliases)) {
      const srcPath = path.join(publicIconsDir, srcFile);
      if (fs.existsSync(srcPath)) {
        const content = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(path.join(publicIconsDir, `${alias}.svg`), content);
        fs.writeFileSync(path.join(distIconsDir, `${alias}.svg`), content);
      }
    }

    console.log('All icons successfully downloaded and aliased!');
  } catch (err) {
    console.error('Error executing icon download script:', err.message);
  }
}

downloadAll();
