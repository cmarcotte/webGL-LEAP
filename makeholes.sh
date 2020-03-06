#/bin/bash

matlab -nodesktop -nosplash -r "holes_generator"

sudo rsync -r --update --progress ./holes.png /var/www/html/app/holes.png


