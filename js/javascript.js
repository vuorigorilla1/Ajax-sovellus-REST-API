const API_AVAIN = '5efadda44b1532d073e31f0d2885dce3';

// Haetaan sivun HTML-elementit.
const hakulomake = document.querySelector('#search-form');
const artistikentta = document.querySelector('#artist-input');
const albumialue = document.querySelector('#albums');
const tilateksti = document.querySelector('#status');
const tulosotsikko = document.querySelector('#results-title');

// fetch pyyntö api:lle 
async function haeTiedot(menetelma, parametrit) {
  const kysely = new URLSearchParams({
    method: menetelma,
    api_key: API_AVAIN,
    format: 'json',
    ...parametrit
  });

// hakee tietoja API:sta
  const vastaus = await fetch(
    'https://ws.audioscrobbler.com/2.0/?' + kysely
  );

  if (!vastaus.ok) {
    throw new Error('Haku epäonnistui.');
  }

  const tiedot = await vastaus.json();

  if (tiedot.error) {
    throw new Error('Haku epäonnistui.');
  }

  return tiedot;
}

function muutaTaulukoksi(arvo) {
  if (Array.isArray(arvo)) return arvo;
  if (arvo) return [arvo];
  return [];
}

// luo html elementin joka näyttää tekstiä
function luoTekstielementti(tunniste, teksti) {
  const elementti = document.createElement(tunniste);
  elementti.textContent = teksti;
  return elementti;
}

// hakee kyseisen artistin albumit
async function haeArtisti(artisti) {
  artisti = artisti.trim();

  if (!artisti) {
    tilateksti.textContent = 'Kirjoita artistin nimi.';
    return;
  }

  albumialue.replaceChildren();
  tulosotsikko.textContent = artisti;
  tilateksti.textContent = 'Haetaan albumeita…';

//hakee suositut albumit ja poistaa nimettömat tulokset 
  try {
    const tiedot = await haeTiedot('artist.gettopalbums', {
      artist: artisti,
      autocorrect: '1'
    });

    const albumit = muutaTaulukoksi(tiedot.topalbums?.album)
      .filter(albumi => albumi.name && albumi.name !== '(null)');

    if (albumit.length === 0) {
      tilateksti.textContent = 'Albumeita ei löytynyt.';
      return;
    }

    tilateksti.textContent =
      'Avaa kappaleet albumin painikkeesta.';

    albumit.forEach(naytaAlbumi);
  } catch (virhe) {
    tilateksti.textContent = 'Haku epäonnistui. Yritä uudelleen.';
  }
}

// albumin kuva nimi ja kuuntelumäärä
function naytaAlbumi(albumi) {
  const kortti = document.createElement('article');
  kortti.className = 'album-card';

  const kuva = document.createElement('img');
  kuva.className = 'cover';
  kuva.alt = albumi.name + ' – kansikuva';

  const kansikuva = muutaTaulukoksi(albumi.image)
    .find(kuva => kuva.size === 'extralarge');

  // asettaa albumille kuvan jos api löytää sellaisen
  if (kansikuva && kansikuva['#text']) {
    kuva.src = kansikuva['#text'];
    kortti.append(kuva);
  }

  const otsikko = luoTekstielementti('h3', albumi.name);

  const artisti = luoTekstielementti(
    'p',
    albumi.artist.name
  );

  const kuuntelut = luoTekstielementti(
    'p',
    Number(albumi.playcount || 0).toLocaleString('fi-FI')
      + ' kuuntelua Last.fm:ssä'
  );

  const painike = luoTekstielementti(
    'button',
    'Näytä kappaleet'
  );
  painike.type = 'button';

  const lisatiedot = document.createElement('div');

  // painike hakee albumin kappaleiden tiedot ja näyttää ne
  painike.addEventListener('click', async () => {
    painike.disabled = true;
    lisatiedot.textContent = 'Haetaan kappaleita…';

    try {
      const tiedot = await haeTiedot('album.getinfo', {
        artist: albumi.artist.name,
        album: albumi.name
      });

      const kappaleet = muutaTaulukoksi(
        tiedot.album?.tracks?.track
      );

      lisatiedot.replaceChildren();

      if (kappaleet.length === 0) {
        lisatiedot.textContent = 'Kappaleita ei löytynyt.';
      } else {
        const lista = document.createElement('ol');
        lista.className = 'track-list';

        kappaleet.forEach(kappale => {
          lista.append(
            luoTekstielementti('li', kappale.name)
          );
        });

        lisatiedot.append(lista);
      }

      painike.hidden = true;
    } catch (virhe) {
      lisatiedot.textContent =
        'Haku epäonnistui. Yritä uudelleen.';
      painike.disabled = false;
    }
  });

  kortti.append(
    otsikko,
    artisti,
    kuuntelut,
    painike,
    lisatiedot
  );

  albumialue.append(kortti);
}

// hoita albumien hakemisen ja toimii joko enter tai hae painikeella
hakulomake.addEventListener('submit', tapahtuma => {
  tapahtuma.preventDefault();
  haeArtisti(artistikentta.value);
});