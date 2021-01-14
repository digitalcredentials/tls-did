# Development

### Installation

```
npm i
```


### Test

```
npm run test
```

### Build

Should be run before each commit.

```
npm run build
```

# Documentation

The tls-did and the tls-did-resolver library allow to create, update, read and delete [Decentralized Identifiers](https://www.w3.org/TR/did-core/) (DIDs). Both libraries support JavaScript and TypeScript. The [tls-did-playground](https://github.com/digitalcredentials/tls-did-playground) shows an exemplary usage; how to create, update, resolve/read and delete TLS-DIDs.

## TLS-DID Method

[DID Method](https://www.w3.org/TR/did-core/#dfn-did-methods)

The TLS-DID Method uses the existing TLS infrastructure to create and verify identities. With this methods DIDs linked to existing domains can be created.

*Method Name*: tls

*TLS-DID Format*: did:tls:\<domain>

*Example TLS-DID*: did:tls:tls-did.de

### Create

To create a TLS-DID, import the tls-did library. First instantiate a TLS-DID object. The constructor expects:
* The private key of an ethereum account with sufficient funds.
* Optionally you can pass a config. Here you can smart contract address of the TLSDIDRegistry. Currently none is deployed to the Ethereum Mainnet. Furthermore, you can pass a an providerConfig. //TODO

```javascript
import { TLSDID } from 'tls-did';

//Setup TLS-DID object
const tlsDid = new TLSDID(etherPrivateKey, {
      registry: REGISTRY_ADDRESS,
      providerConfig: {
        jsonRpcUrl: jsonRpcUrl),
      },
});
```

After you instantiated the TLS-DID object you can either deploy a new TLSDIDContract to the Ethereum chain or connect to a previously deployed contract using its smart contract address. After deployment the smart contract address is stored in the TLS-DID object's address property.

```javascript
await tlsDid.deployContract();
const address = tlsDid.address;
```

```javascript
await tlsDidDuplicate.connectToContract(address)
```

In the next step you register the newly created TLDDIDContract in the TLSDIDRegistry. The registerContract function expects the domain for which you want to create a DID and the TLS private key.

```javascript
await tlsDid.registerContract(domain, pemKey)

```

In the final step you store the TLS certification chain up to but not including the TLS root certificate.

```javascript
const chain = [
  '-----BEGIN CERTIFICATE-----\nCert\n-----END CERTIFICATE-----',
  '-----BEGIN CERTIFICATE-----\nIntermediateCert\n-----END CERTIFICATE-----',
];
await tlsDid.addChain(chain, pemKey);
```
### Update
To update or add information to the DID Document the TLS-DID object has multiple methods.

You can add an expiry to your TLSDIDContract. After this date the contract is still readable, however the tls-did-resolver library will interpret this as an invalid contract and not resolve the DID.

```javascript
const expiry = new Date('12 / 12 / 2040');
await tlsDid.setExpiry(expiry, pemKey);
```

You can add
```javascript
await tlsDid.addAttribute('parent/child', 'value', pemKey);
```
### Read
For reading two paths exist:

* The DID Controller reads the contract by connecting to the exiting smart contract as described in [Create](#Create). All available data is the accessible via the TLS-DID object's properties.

* To resolve a TLS-DID, import the getResolver function from tls-did-resolver library. When calling the getResolver function you can pass a provider config, a registry address and a string array of trusted TLS root certificates in the pem format. If you do not pass the root certificates, node's TLS root certificates are used.

```javascript
import { getResolver } from 'tls-did-resolver';

//Instantiate resolver
const tlsResolver = tls.getResolver(providerConfig, REGISTRY_ADDRESS, rootCerts);

//Resolve DID
const didDocument = await tlsResolver.tls(`did:tls:tls-did.de`, null, null);
```

### Delete
To delete the TLS-DID, execute the delete method. This triggers the TLSDIDContract's self destruct and will remove the reference from the TLSDIDRegistry. Note that running the delete method will remove all information stored in the tlsDid object's properties.
```javascript
await tlsDid.delete();
```