export function computeFFT(dataArray: number[], dtMs: number) {
  let n = dataArray.length;
  if (n < 2) return { freq: [], mag: [] };

  let power = Math.pow(2, Math.floor(Math.log2(n)));
  let real = dataArray.slice(0, power);
  let imag = new Array(power).fill(0);
  n = power;

  let i = 0, j = 0, k = 0, n2 = n / 2;
  for (i = 1, j = 0; i < n; i++) {
    let bit = n2;
    while (j >= bit) { j -= bit; bit /= 2; }
    j += bit;
    if (i < j) {
      let t = real[i]; real[i] = real[j]; real[j] = t;
      t = imag[i]; imag[i] = imag[j]; imag[j] = t;
    }
  }

  for (k = 1; k < n; k *= 2) {
    let theta = -Math.PI / k;
    let wReal = Math.cos(theta);
    let wImag = Math.sin(theta);
    for (i = 0; i < n; i += 2 * k) {
      let uReal = 1, uImag = 0;
      for (j = 0; j < k; j++) {
        let tReal = uReal * real[i + j + k] - uImag * imag[i + j + k];
        let tImag = uReal * imag[i + j + k] + uImag * real[i + j + k];
        real[i + j + k] = real[i + j] - tReal;
        imag[i + j + k] = imag[i + j] - tImag;
        real[i + j] += tReal;
        imag[i + j] += tImag;
        let nextUReal = uReal * wReal - uImag * wImag;
        let nextUImag = uReal * wImag + uImag * wReal;
        uReal = nextUReal; uImag = nextUImag;
      }
    }
  }

  let mag = [];
  let freq = [];
  let fs = 1000 / dtMs; // Sample freq in Hz

  for (i = 0; i < n / 2; i++) { // only positive frequencies
    mag.push(Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / n);
    freq.push(i * (fs / n));
  }

  return { freq, mag };
}
