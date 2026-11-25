"""Validate a locally downloaded unsigned iPhone IPA using only Python's standard library."""
import plistlib
import struct
import sys
import zipfile
from pathlib import Path

ipa = Path(sys.argv[1])
with zipfile.ZipFile(ipa) as archive:
    assert archive.testzip() is None, 'Corrupt IPA archive'
    infos = [name for name in archive.namelist() if name.startswith('Payload/') and name.count('/') == 2 and name.endswith('.app/Info.plist')]
    assert len(infos) == 1, 'Expected exactly one application inside Payload'
    info = plistlib.loads(archive.read(infos[0]))
    root = infos[0].removesuffix('Info.plist')
    executable = archive.read(root + info['CFBundleExecutable'])
    magic, cpu, _, filetype, commands, _, _, _ = struct.unpack_from('<8I', executable)
    assert magic == 0xFEEDFACF and cpu == 0x0100000C and filetype == 2, 'Expected an ARM64 iPhone executable'
    assert info.get('CFBundleSupportedPlatforms') == ['iPhoneOS'], 'Simulator binaries cannot be installed on an iPhone'
    assert info.get('CFBundleDisplayName') == 'MoreMoney'
    assert float(info['MinimumOSVersion']) >= 17
    assert 'de.moremoney.quote-refresh' in info.get('BGTaskSchedulerPermittedIdentifiers', []), 'Missing background refresh declaration'
    assert 'fetch' in info.get('UIBackgroundModes', []), 'Missing background refresh mode'
    assert not any(name.endswith('embedded.mobileprovision') for name in archive.namelist()), 'Expected unsigned output for personal re-signing'
    position = 32
    for _ in range(commands):
        command, length = struct.unpack_from('<II', executable, position)
        if command == 0x2C:
            assert struct.unpack_from('<I', executable, position + 16)[0] == 0, 'Encrypted binary cannot be re-signed'
        position += length
    print(f"Valid iPhone IPA: {info['CFBundleDisplayName']} {info['CFBundleShortVersionString']}, ARM64, iOS {info['MinimumOSVersion']}+, ready for re-signing")
