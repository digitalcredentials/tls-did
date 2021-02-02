# TLS-DID Method

[DID Method](https://www.w3.org/TR/did-core/#dfn-did-methods)

The TLS-DID method uses the existing TLS infrastructure to create and verify identities. With this method  you can create DIDs verifiably linked to existing domains using the domain's TLS key pair.

## TLS-DID Format

TLS-DIDs have the following format:
```
tls-did             = "did:tls:" tls-did-identifier

tls-did-identifier  = Second-Level-Domain Top-Level-Domain
```

Example TLS-DID:
```
did:tls:tls-did.de
```
## TLS-DID Operations

In this section we describe the four operations each DID method must specify.
### Create

To create a TLS-DID we deploy a smart contract to the Ethereum blockchain. We register the contract in the TLS-DID registry smart contract with its TLS-DID method-specific identifier (a domain). **Note** that we do not verify the correctness of an association between a TLS-DID and a domain on creation. Therefore, anyone can register a smart contract with any identifier. Thats why we verify each smart contract in the [read/resolve](#read) operation.

### Update

We store the DID documents data in the [TLSDID Contract](#TLSDID-Contract). We store data as a combination of path and value. Currently we only support string values. Furthermore, we do not check the data, this means, that you are responsible that the data you add, adheres to the [DID document data model specification](https://www.w3.org/TR/did-core/#data-model).

 Only the controller of the Ethereum account that created the [TLSDID Contract](#TLSDID-Contract) can update the contract and after each data update, the [TLSDID Contract's](#TLSDID-Contract) signature is updated using the TLS private key.

As an extension to the DID document standard we allow you to store an expiry date in the [TLSDID Contract](#TLSDID-Contract). The [read/resolve](#read) operation interprets the [TLSDID Contract](#TLSDID-Contract) to be invalid and does not resolve the DID if the current date is later then the stored expiry date.

### Read

To resolve a TLS-DID we first query the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract). This results in a set of 0-* [TLSDID Contract](#TLSDID-Contract) addresses. If zero addresses are found, the TLS-DID does not resolve. If one address is found we verify the correctness of the [TLSDID Contract's](#TLSDID-Contract) data. If more the one addresses is found, we verify the correctness of the contained data of each [TLSDID Contract](#TLSDID-Contract). In the case of multiple addresses, the DID only resolves if exactly one [TLSDID Contract](#TLSDID-Contract) is valid.

To verify the validity of a [TLSDID Contract](#TLSDID-Contract), we first verify that its expiration date is in the future. Then we load the stored TLS chain and check it against a set of trusted root certs. If the chain is valid, we check the domain cert against the issuing CA's OCSP if available. In the final step, we read the DID document data from the [TLSDID Contract](#TLSDID-Contract) and verify the [TLSDID Contracts](#TLSDID-Contract) signature against the stored data and the verified domain cert. If the signature is valid we deem the [TLSDID Contract](#TLSDID-Contract) to be valid.

If exactly one valid [TLSDID Contract](#TLSDID-Contract) is found the requested DID document is constructed from the [TLSDID Contract's](#TLSDID-Contract) data.

### Delete

To delete a TLS-DID we remove the corresponding smart contract from the Ethereum chain. Furthermore, we set the smart contract address stored in the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract) to *0x0000000000000000000000000000000000000000*.

# Security Considerations

## Eavesdropping

## Replay

## Message Insertion

## Deletion

## Modification

## Man-in-the-Middle

## Denial of Service

# Privacy Considerations

## Surveillance

## Stored Data Compromise

## Unsolicited Traffic

## Misattribution

## Correlation

## Identification

## Secondary Use

## Disclosure

## Exclusion