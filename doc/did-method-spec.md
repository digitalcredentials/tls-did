# TLS-DID Method

The TLS-DID method is a [DID Method](https://www.w3.org/TR/did-core/#dfn-did-methods) that makes use the internet's existing [Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security) infrastructure. The TLS-DID method allows you to create and verify DIDs on the Ethereum blockchain verifiably linked to an existing domain. The link between a DID and a domain is created using of the domain's TLS key pair.

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

**Note** that in the following we mean the Second-Level-Domain and Top-Level-Domain when we use "domain".
### Create

To create a TLS-DID we deploy a TLS-DID smart contract linked to a domain using the domain's TLS key pair to the Ethereum blockchain and register the contract in the TLS-DID registry smart contract with its TLS-DID method-specific identifier (domain).

Prerequisites:

- TLS key pair (TLS certificate & TLS encryption key) issued by trusted Certificate Authority
- TLS certificate chain without root certificate
- Ethereum account with sufficient funds

Creating the initial tls-did:

1. Deploy TLS-DID smart contract
2. Store the domain in TLS-DID smart contract
3. Store the TLS certificate chain in TLS-DID smart contract
3. Store a signature(hash(TLS-DID smart contract's address, domain, TLS certificate chain)) in the TLS-DID smart contract.
4. Store the domain and the TLS-DID smart contract address in the TLS-DID registry smart contract

**Note** that we do not verify the correctness of the link between a TLS-DID and a domain on creation. Therefore, anyone can register a smart contract with any identifier. We verify the link in the [read/resolve](#read) operation.

### Update

We store the DID documents data in the [TLSDID Contract](#TLSDID-Contract). We store data as a combination of path and value. Currently we only support string values. Furthermore, we do not check the data, this means, that you are responsible that the data you add, adheres to the [DID document data model specification](https://www.w3.org/TR/did-core/#data-model).

Only the controller of the Ethereum account that created the [TLSDID Contract](#TLSDID-Contract) can update the contract and after each data update, the [TLSDID Contract's](#TLSDID-Contract) signature is updated using the TLS private key.

Prerequisites:

- TLS encryption key
- Ethereum account with sufficient funds that created the [TLSDID Contract](#TLSDID-Contract)

Updating the DID document:

1. Store path-value pair in TLS-DID smart contract
2. Overwrite the signature(hash(TLS-DID smart contract's address, domain, TLS certificate chain, path-value pairs)) in the TLS-DID smart contract

As an extension to the DID document standard we allow you to store an expiry date in the [TLSDID Contract](#TLSDID-Contract). The [read/resolve](#read) operation interprets the [TLSDID Contract](#TLSDID-Contract) to be valid only if the expiry date is in the future.

### Read

To resolve a TLS-DID we first query the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract). This results in a set of 0-* [TLSDID Contract](#TLSDID-Contract) addresses. If zero addresses are found, the TLS-DID does not resolve. If one address is found we verify the correctness of the [TLSDID Contract's](#TLSDID-Contract) data. If more than one addresses is found, we verify the correctness of the contained data of each [TLSDID Contract](#TLSDID-Contract). In the case of multiple addresses, the DID only resolves if exactly one [TLSDID Contract](#TLSDID-Contract) is valid.

To verify the validity of a [TLSDID Contract](#TLSDID-Contract), we first verify that its expiration date is in the future. Then we load the stored TLS chain and check it against a set of trusted root certs. If the chain is valid, we check the domain cert against the issuing CA's OCSP if available. In the final step, we read the DID document data from the [TLSDID Contract](#TLSDID-Contract) and verify the [TLSDID Contracts](#TLSDID-Contract) signature against the stored data and the verified domain cert. If the signature is valid we deem the [TLSDID Contract](#TLSDID-Contract) to be valid.

If exactly one valid [TLSDID Contract](#TLSDID-Contract) is found the requested DID document is constructed from the [TLSDID Contract's](#TLSDID-Contract) data.

### Delete

To delete a TLS-DID we remove the corresponding smart contract from the Ethereum blockchain. Furthermore, we set the smart contract address stored in the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract) to *0x0000000000000000000000000000000000000000*.

# Security Considerations

Have to be kept secret:
- TLS encryption key
- Ethereum private key

## Eavesdropping

## Replay

## Message Insertion

## Deletion

## Modification

## Man-in-the-Middle

## Denial of Service

## Residual Risks

risks from compromise in a related protocol, incorrect implementation, or cipher

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
