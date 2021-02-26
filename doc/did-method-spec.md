# TLS-DID Method

The TLS-DID method is a [DID Method](https://www.w3.org/TR/did-core/#dfn-did-methods) that makes use the internet's existing [Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security) infrastructure. The TLS-DID method allows you to create and verify DIDs on the Ethereum blockchain verifiably linked to an existing domain. The link between a DID and a domain is created using of the domain's TLS key pair.

- [TLS-DID Method](#tls-did-method)
  - [TLS-DID Format](#tls-did-format)
  - [TLS-DID Operations](#tls-did-operations)
    - [Create](#create)
    - [Update](#update)
    - [Read](#read)
    - [Delete](#delete)
- [Security Considerations](#security-considerations)
  - [Third Party Risks:](#third-party-risks)
  - [Downgrade](#downgrade)
  - [Eavesdropping](#eavesdropping)
  - [Replay](#replay)
  - [Message Insertion](#message-insertion)
  - [Deletion](#deletion)
  - [Modification](#modification)
  - [Man-in-the-Middle](#man-in-the-middle)
  - [Denial of Service](#denial-of-service)
  - [Residual Risks](#residual-risks)
- [Privacy Considerations](#privacy-considerations)
  - [Surveillance](#surveillance)
  - [Stored Data Compromise](#stored-data-compromise)
  - [Unsolicited Traffic](#unsolicited-traffic)
  - [Misattribution](#misattribution)
  - [Correlation](#correlation)
  - [Identification](#identification)
  - [Secondary Use](#secondary-use)
  - [Disclosure](#disclosure)
  - [Exclusion](#exclusion)

- [Privacy Considerations](#privacy-considerations)

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

## Third Party Risks:
- Certificate Authority compromise: If a Certificate Authority is compromised an attacker might:
  1. invalidate a current TLS certificate private key pair, if recorded in OCSP the TLS-DID does not resolve.
  2. create a new TLS key pair allowing the attacker to create a TLS-DID in the attacker's control.

- TLS key pair compromise: If an attacker gains control over a currently used TLS key pair, the attacker can create a new TLS-DID contract for a domain. If two contracts for the same domain exist the TLS-DID does not resolve.

- Ethereum key pair compromise: If an attacker gains control over an ethereum key pair used to create a TLS-DID contract the attacker can:
  1. upload invalid data to the TLS-DID contract. The TLS-DID does not resolve.
  2. delete the TLS-DID contract. The TLS-DID does not resolve.

A possible mitigation for these security risks would be to monitor changes to a TLS-DID contract and the creation of possibly competing TLS-DID contracts. Competing smart contracts contain the TLS-DID's domain.
## Downgrade

- Andere DID Methode: Uli's Paper

## Eavesdropping

## Replay

## Message Insertion

## Deletion

## Modification

## Man-in-the-Middle

## Denial of Service

TODO: Distributed Denial of Service: Viele Smart Contracts falsch, performance?
Kosten

## Residual Risks

risks from compromise in a related protocol, incorrect implementation, or cipher
cross protocol attacks: no attack vectors

# Privacy Considerations

## Surveillance

- The TLS-DID Method relies on the ethereum blockchain which can be tracked. The create, update and delete operation can be tracked. However, we develop the TLS-DID method to be used by institutions for interaction with the public.

- Certificate authorities might track request to their OCSP service and thereby
track who and how often a TLS-DID is resolved.

## Stored Data Compromise

## Unsolicited Traffic



## Misattribution

## Correlation

## Identification

## Secondary Use

## Disclosure

## Exclusion