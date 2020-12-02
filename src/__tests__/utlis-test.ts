import { chainToCerts } from '../utils';
describe('Utils', () => {
  it('should split split chain into pem array', () => {
    let chain = `-----BEGIN CERTIFICATE-----
CertA
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
CertB
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
CertC
-----END CERTIFICATE-----`;

    const certs = chainToCerts(chain);

    const _certs = [
      '-----BEGIN CERTIFICATE-----\nCertA\n-----END CERTIFICATE-----',
      '-----BEGIN CERTIFICATE-----\nCertB\n-----END CERTIFICATE-----',
      '-----BEGIN CERTIFICATE-----\nCertC\n-----END CERTIFICATE-----',
    ];
    //Assert that the chain has been split correctly
    expect(certs).toEqual(_certs);
  });
});
