const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.get('/', async (req, res) => {
   let browser;

  try {
    browser = await puppeteer.launch({
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'accept-language': 'es-ES,es;q=0.9'
    });

    await page.goto('https://www.sbs.gob.pe/app/pp/sistip_portal/paginas/publicacion/tipocambiopromedio.aspx', {
      waitUntil: 'networkidle2'
    });

     const resultado = await page.evaluate(() => {
      const filas = document.querySelectorAll('.rgMasterTable tbody tr');

      for (const fila of filas) {
        const columnas = fila.querySelectorAll('td');
        const moneda = columnas[0]?.innerText.trim();

        if (moneda === 'Dólar de N.A.') {
          const compra = columnas[1]?.innerText.trim();
          const venta = columnas[2]?.innerText.trim();
          return { compra, venta };
        }
      }

      return null;
    });

    await browser.close();

    if (resultado) {
      res.json({
        moneda: 'Dólar de N.A.',
        compra: resultado.compra,
        venta: resultado.venta
      });
    } else {
      res.status(404).send('No se encontró el tipo de cambio del Dólar de N.A.');
    }

  } catch (error) {
    console.error('Error al obtener el contenido:', error);
    if (browser) await browser.close();
    res.status(500).send('Error al obtener el contenido');
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor escuchando en http://localhost:${port}`));

