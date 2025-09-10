import qrcode
import os

# List of the 100 unique asset IDs from your database
asset_ids = [
    'RST-1', 'RST-2', 'RST-3', 'RST-4', 'RST-5', 'RST-6', 'RST-7', 'RST-8', 'RST-9', 'RST-10',
    'RST-11', 'RST-12', 'RST-13', 'RST-14', 'RST-15', 'RST-16', 'RST-17', 'RST-18', 'RST-19', 'RST-20',
    'RST-21', 'RST-22', 'RST-23', 'RST-24', 'RST-25', 'RST-26', 'RST-27', 'RST-28', 'RST-29', 'RST-30',
    'RST-31', 'RST-32', 'RST-33', 'RST-34', 'RST-35', 'RST-36', 'RST-37', 'RST-38', 'RST-39', 'RST-40',
    'RST-41', 'RST-42', 'RST-43', 'RST-44', 'RST-45', 'RST-46', 'RST-47', 'RST-48', 'RST-49', 'RST-50',
    'BIN-1', 'BIN-2', 'BIN-3', 'BIN-4', 'BIN-5', 'BIN-6', 'BIN-7', 'BIN-8', 'BIN-9', 'BIN-10',
    'BIN-11', 'BIN-12', 'BIN-13', 'BIN-14', 'BIN-15', 'BIN-16', 'BIN-17', 'BIN-18', 'BIN-19', 'BIN-20',
    'BIN-21', 'BIN-22', 'BIN-23', 'BIN-24', 'BIN-25', 'BIN-26', 'BIN-27', 'BIN-28', 'BIN-29', 'BIN-30',
    'BIN-31', 'BIN-32', 'BIN-33', 'BIN-34', 'BIN-35', 'BIN-36', 'BIN-37', 'BIN-38', 'BIN-39', 'BIN-40',
    'BIN-41', 'BIN-42', 'BIN-43', 'BIN-44', 'BIN-45', 'BIN-46', 'BIN-47', 'BIN-48', 'BIN-49', 'BIN-50'
]

# Create a directory to save the QR codes
output_dir = 'qr-codes'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Generating {len(asset_ids)} QR codes...")
for asset_id in asset_ids:
    # Generate the QR code with the asset ID as data
    qr_img = qrcode.make(asset_id)
    # Save the QR code as a file
    qr_img.save(os.path.join(output_dir, f'{asset_id}.png'))

print("QR code generation complete!")
print(f"You can find your QR codes in the '{output_dir}' folder.")