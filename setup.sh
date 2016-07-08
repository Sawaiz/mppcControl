#!/bin/bash
#Check if running as root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

read -e -p "Change hostname to: " host
read -e -s -p "Root (pi) Password :" rootPasswd
echo ""
read -e -p "Username :" userName
read -e -s -p "$userName Password :" userPasswd
echo ""

#Update/upgrade
apt-get update && apt-get -y upgrade

#Change root (pi) password
echo "pi:$rootPasswd" | chpasswd

#Assign existing hostname to $hostn
hostn=$(cat /etc/hostname)

#change hostname in /etc/hosts & /etc/hostname
sudo sed -i "s/$hostn/$host/g" /etc/hosts
sudo sed -i "s/$hostn/$host/g" /etc/hostname

#Create the user
useradd -m -G sudo $userName
echo "$userName:$userPasswd" | chpasswd
