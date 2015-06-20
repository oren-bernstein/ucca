import subprocess

#i = subprocess.call(['python3', 'convert_standard_to_site.py', 'passage106.xml', 'x2'], env={'PYTHONPATH': '.:./..'})
#print([i])


#returncode = subprocess.call(['python3', 'convert_standard_to_site.py', 'XML_INPUT', 'XML_OUTPUT_FILE'], env={'PYTHONPATH': '.:./..'})

returncode = subprocess.call(['/usr/bin/python3', 'convert_standard_to_site.py', 'passage106.xml', 'XML_OUTPUT_FILE'], env={'PYTHONPATH': '.:./..'})

print(returncode)

