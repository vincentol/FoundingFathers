import json
import math
import random

arr = []
i = 0
while (i < 1000):
	arr.append(0)
	if (i > 250): 
		arr[i] = math.floor(random.random()*800)+1
	i+=1

#hard coded values to wizard of oz UCSD area

#apparently json.dumps doesnt work so i just did this stuff manually
outFileName = 'priceData.json'
with open(outFileName, 'w') as outFile:
	outFile.write('[')
	for x in arr:
		outFile.write(str(x))
		outFile.write(",")
	outFile.write(']')
