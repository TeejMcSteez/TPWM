#!/bin/bash

# I need to make a way to setup the root login variables as well as load the filesystem properly 
# as file permissions is the main thing keeping this secure 
system= $uname 

if [[ $system =~ MSYS+ ]]; then 
    echo "Assigning path to rootPath"
fi
if [[ $system =~ Linux]]; then 
    echo "Assigning path to rootPath"
fi 
    