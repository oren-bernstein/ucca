import re

def preprocessPassage(inpStr):

    inpStr = re.sub("\[[0-9]+\]", "", inpStr).strip()         # discarding references
    parags = re.split('\n\n+', inpStr)
    output = []
    
    for parag in parags:
        inpWords = re.split("\s+", parag.strip())
        i = 0
        while i < len(inpWords):
            changed = 1
            splitIndex = endsWithApostrophe(inpWords[i])
            if splitIndex != None and splitIndex > 0:
                inpWords[i:i+1] = [inpWords[i][:splitIndex], inpWords[i][splitIndex:]]
            
            if len(inpWords[i]) > 1 and splitIndex == None:
                if inpWords[i][-1] == "." or inpWords[i][-1] == ",":
                    inpWords[i:i+1] = [inpWords[i][:-1], inpWords[i][-1]]
                punctInd = re.search("[\/\:!\?\(\)\[\]\'\"\{\}\+&\%\$-<>]", inpWords[i])
                if punctInd != None:
                    punctInd = punctInd.start()
                    newList = [inpWords[i][punctInd]]
                    if punctInd > 0:
                        newList[0:0] = [inpWords[i][:punctInd]]
                    if punctInd < len(inpWords[i]):
                        newList.append(inpWords[i][punctInd+1:])
                    inpWords[i:i+1] = newList

            i += changed
        
        output.append(' '.join(inpWords))

    return '\n\n'.join(output)

def endsWithApostrophe(s):
    apostrophes = ["'s", "'m", "'re", "'ll", "'d", "'ve", "n't", "..."]
    for x in apostrophes:
        if s.endswith(x):
            return len(s) - len(x)
    return None



