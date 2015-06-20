#! /usr/bin/python3
from ucca import convert
import sys
from xml.etree.ElementTree import ElementTree, tostring, fromstring

def file2passage(filename):
    "Opens a standard xml file and returns its parsed Passage object"
    with open(filename) as f:
        etree = ElementTree().parse(f)
    return convert.from_standard(etree)

if len(sys.argv) != 3:
    print('Usage: convert_standard_to_site <input filename> <output filename>')
    sys.exit(-1)

P = file2passage(sys.argv[1])
output = tostring(convert.to_site(P)).decode()
with open(sys.argv[2], 'w') as outf:
    outf.write(output)

sys.exit(0)
