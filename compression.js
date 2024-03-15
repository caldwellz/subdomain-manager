const { COMPRESSION_INPUT_MIN, COMPRESSION_LEVEL, NODE_ENV = 'development' } = process.env;
const { promisify } = require('node:util');
const { roundToPlaces } = require('./lib');
const zlib = require('node:zlib');

const compress = promisify(zlib.brotliCompress);
let compressionInputMin = parseInt(COMPRESSION_INPUT_MIN);
if (isNaN(compressionInputMin)) compressionInputMin = 2048;
let compressionLevel = parseInt(COMPRESSION_LEVEL);
if (isNaN(compressionLevel)) compressionLevel = 5;

async function doCompress(data, res) {
  res.set('Content-Type', 'application/json; charset=utf-8');
  let output = JSON.stringify(data, null, 0);
  const origLength = output.length;
  if (origLength >= compressionInputMin) {
    res.set('Content-Encoding', 'br');
    output = await compress(output, {
      chunkSize: 16 * 1024,
      params: {
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        [zlib.constants.BROTLI_PARAM_QUALITY]: compressionLevel,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: output.length,
      },
    });
  }
  return { output, origLength };
}

/** Overrides req.json with a method that offers transparent Brotli compression
 * (not available through Express compression middleware). */
function compressionMiddleware(req, res, next) {
  if (!req.acceptsEncodings('br')) return next();
  res.json = async (data) => {
    const { output } = await doCompress(data, res);
    res.send(output);
  };
  next();
}

/** Calculates and adds X-Compression-* headers. */
function compressionMiddlewareWithInfo(req, res, next) {
  if (!req.acceptsEncodings('br')) return next();
  res.json = async (data) => {
    const compStart = performance.now();
    const { output, origLength } = await doCompress(data, res);
    const compEnd = performance.now();
    const savings = origLength - output.length;
    res.set('X-Compression-Time', roundToPlaces(compEnd - compStart, 2) + 'ms');
    res.set('X-Compression-Savings-KB', roundToPlaces(savings / 1024, 2));
    res.set('X-Compression-Savings-Pct', roundToPlaces((savings / origLength) * 100, 2));
    res.send(output);
  };
  next();
}

function compression() {
  if (NODE_ENV === 'development') return compressionMiddlewareWithInfo;
  else return compressionMiddleware;
}

module.exports = compression;
