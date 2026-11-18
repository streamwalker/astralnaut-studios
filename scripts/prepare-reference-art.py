"""Resize supplied canon artwork for web delivery without repainting it."""
from pathlib import Path
from PIL import Image
root=Path('/Users/streamwalkersceo/Library/Mobile Documents/com~apple~CloudDocs/Astralnaut Studios/Battlefield Atlantis')
out=Path(__file__).resolve().parents[1]/'public/space-journey/reference-art'
refs={
 'santee':'1. Character Study/Santee Station/Santee Station 2.jpg',
 'ryuken':'1. Character Study/Starship Ryuken/Ryuken One.jpg',
 'orbit':'2. Kickstarter - Battlefield Atlantis 1/Rewards and Elements/Ships in Orbit.png',
 'bridge':'2. Kickstarter - Battlefield Atlantis 1/Rewards and Elements/Correct Color Grading - Ryuken Battle Bridge Crew.png',
 'city':'2. Kickstarter - Battlefield Atlantis 1/Images/Image 6-26-26 at 5.04\u202fAM.PNG',
}
for name,path in refs.items():
 im=Image.open(root/path).convert('RGB');im.thumbnail((1920,1440))
 im.save(out/(name+'.webp'),quality=91,method=6)
 print(name,im.size,(out/(name+'.webp')).stat().st_size)
