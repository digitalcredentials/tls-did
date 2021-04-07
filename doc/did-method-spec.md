# TLS-DID Method

The TLS-DID method is a [DID Method](https://www.w3.org/TR/did-core/#dfn-did-methods) that makes use of the internet's existing [Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security) infrastructure. The TLS-DID method allows you to create and verify DIDs on the Ethereum blockchain verifiably linked to a domain. The link between a DID and a domain is created using of the domain's TLS key pair.

- [TLS-DID Method](#tls-did-method)
  - [TLS-DID Format](#tls-did-format)
  - [CRUD Operations](#crud-operations)
    - [Create](#create)
    - [Update](#update)
    - [Read](#read)
    - [Delete](#delete)
- [Security Considerations](#security-considerations)
  - [Third Party Risks:](#third-party-risks)
  - [Downgrade](#downgrade)
  - [Eavesdropping](#eavesdropping)
  - [Replay](#replay)
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
## CRUD Operations

In this section we describe the four operations each DID method must specify.

**Claim** Ethereum address/TLS-DID identifier pair
### Create

Prerequisites:

- TLS key pair (TLS certificate & TLS encryption key) issued by trusted Certificate Authority
- TLS certificate chain without root certificate
- Ethereum account with sufficient funds

Creating the initial tls-did:

1. Register claim to an TLS-DID identifier on TLS-DID registry smart contract
2. Store the TLS certificate chain on chain using the TLS-DID registry smart contract
3. Store a signature(hash(domain, TLS certificate chain)) on chain using the TLS-DID registry smart contract

**Note** that we do not verify the correctness of the link between a TLS-DID and a domain on creation. Therefore, anyone can register a claim to an identifier. We verify the link in the [read/resolve](#read) operation.

### Update

We store the DID document's data in the [TLSDID Contract](#TLSDID-Contract). We store data as a combination of path and value. Currently we only support string values. Furthermore, we do not check the data, this means, that you are responsible that the data you add, adheres to the [DID document data model specification](https://www.w3.org/TR/did-core/#data-model).

Only the controller of the Ethereum account that created initial claim can update the data stored on chain using the TLS-DID registry smart contract.

Prerequisites:

- TLS encryption key
- The Ethereum account with sufficient funds used in the [create](#create) operation

Updating the DID document:

1. Store path-value pair on chain using the TLS-DID registry smart contract
2. Store updated signature(hash(domain, TLS certificate chain, path-value pairs)) on chain using the TLS-DID registry smart contract

As an extension to the DID document standard we allow you to store an expiry date on chain using the TLS-DID registry smart contract. The [read/resolve](#read) operation interprets the claim to the TLS-DID identifier to be valid only if the expiry date is in the future.

### Read

To resolve a TLS-DID we query [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract) for all claims for the TLS-DID identifier. This results in a set of 0-* claims. If zero claims are found, the TLS-DID does not resolve. If one claim is found we verify the correctness of the claim. If more than one claim is found, we verify the correctness of each claim. The TLS-DID only resolves if exactly one claim is valid.

To verify the validity of a claim, we read the last change event block from the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract). If none is found the claim is invalid, since no chain and signature could be read from chain. If a last change event block is found, we query the block for all change events associated with the claim and store the change event data. Each change event contains the previous last change block. We repeat the process until we reach a change event with a last change block number equal to zero. We aggregate the data stored in the change events. We use the most recent signature, chain and expiry. We verify that:
- the expiry it is in the future, if am expiry was stored on chain,
- the domain's TLS certificate was not revoked, if [OCSP](https://en.wikipedia.org/wiki/Online_Certificate_Status_Protocol) is supported,
- a TLS root certificate can be found for the TLS certificate chain,
- the TLS certificate chain including the TLS root certificate is valid,
- `verify(signature, hash(domain, TLS certificate chain, path-value pairs))` is valid.

If exactly one claim fulfills the requirements we construct a DID Document using the attributes path/value combinations stored in the change events on chain.

Currently the TLS-DID libraries do not allow to resolve paths/fragments of the DID Document (https://github.com/digitalcredentials/tls-did/issues/28).

### Delete

To delete a TLS-DID, we set the last change event block number of the claim's TLS-DID identifier to 0 in the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract).

# Security Considerations

Have to be kept secret:
- TLS encryption key
- Ethereum private key

## Third Party Risks:
- Certificate Authority compromise: If a Certificate Authority is compromised an attacker might:
  1. invalidate a current TLS certificate private key pair, if recorded in OCSP the TLS-DID does not resolve.
  2. create a new TLS key pair allowing the attacker to create a TLS-DID in the attacker's control.

- TLS key pair compromise: If an attacker gains control over a currently used TLS key pair, the attacker can create a new TLS-DID contract for a FQDN. If two contracts for the same FQDN exist the TLS-DID does not resolve.

- Ethereum key pair compromise: If an attacker gains control over an ethereum key pair used to create a TLS-DID contract the attacker can:
  1. upload invalid data to the TLS-DID contract. The TLS-DID does not resolve.
  2. delete the TLS-DID contract. The TLS-DID does not resolve.

A possible mitigation for these security risks would be to monitor changes to a TLS-DID contract and the creation of possibly competing TLS-DID contracts. Competing smart contracts contain the TLS-DID's FQDN.
## Downgrade


## Eavesdropping
No private information should be stored on the TLS-DID registry and TLS-DID contracts, thus no private information should be transmitted.

## Replay

If an attacker delays an signature update the TLS-DID, the contract does not resolve in the meantime.

If an attacker delays a signature update after a change of the TLS-DID contract and a seconde signature update, the TLS-DID contract does not resolve due to an now invalid signature.
## Deletion

See **Third Party Risks**.
## Modification

See **Third Party Risks**.
## Man-in-the-Middle

Communication with the ethereum mainnet:An attacker could alter the data read from chain.

Communication with CA: An attacker could pretend that an invalid certificate is valid.

## Denial of Service

To slow down the resolve-time of a TLS-DID, an attacker might upload a number of invalid TLS-DID contracts linked in the TLS-DID registry to the same FQDN as a victim's TLS-DID contract.
In the worst case only the signature of the attacker's TLS-DID contracts is invalid; the tls-did-resolver has to read all data from the TLS-DID contracts prior to the final signature validity check.
The time to resolve one to multiple TLS-DID contracts scales linearly.

In a benchmark run with a local testnet the resolve-time of:
 - one TLS-DID contract was approximately 600ms.
 - 100 TLS-DID contracts was approximately 20400ms.

The mitigation to this attack, is the cost of deployment of a TLS-DID contract to the ethereum mainnet.

## Residual Risks

If node-forge's certificate chain verification or node's signature verification are compromised, a vulnerability might be introduced to the verification of TLS-DID contract signatures.

# Privacy Considerations

## Surveillance

- The TLS-DID Method relies on the ethereum blockchain which can be tracked. The create, update and delete operation can be tracked. However, we develop the TLS-DID method to be used by institutions for interaction with the public.

- Certificate authorities might track request to their OCSP service and thereby
track who and how often a TLS-DID is resolved.

## Stored Data Compromise

The information stored in the TLS-DID registry and TLS-DID contracts is publicly readable, therefore no private information should be stored on them.

## Unsolicited Traffic

## Misattribution

## Correlation

## Identification

## Secondary Use

## Disclosure

## Exclusion