from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

# Générer une clé privée ECDSA
private_key = ec.generate_private_key(ec.SECP256R1())

# Sérialiser la clé privée en format PEM
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

# Générer la clé publique correspondante
public_key = private_key.public_key()

# Sérialiser la clé publique en format PEM
public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Encoder les clés en base64url
private_base64url = base64.urlsafe_b64encode(private_pem).rstrip(b'=')
public_base64url = base64.urlsafe_b64encode(public_pem).rstrip(b'=')

print("Clé privée VAPID (base64url) :", private_base64url.decode())
print("Clé publique VAPID (base64url) :", public_base64url.decode())
