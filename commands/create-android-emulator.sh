#!/bin/sh

# Download SDK Packages.
sdkmanager --verbose "build-tools;22.0.1" "emulator" "extras;intel;Hardware_Accelerated_Execution_Manager" "ndk-bundle" "platform-tools" "platforms;android-22" "system-images;android-22;google_apis;x86_64" "tools"

# Link Skin.
mkdir -p $ANDROID_HOME/skins/nexus_6
cp -f commands/nexus_6/* $ANDROID_HOME/skins/nexus_6/

# Create AVD.
avdmanager create avd -c 100M -f -n "Nexus6" -d "Nexus 6" -k 'system-images;android-22;google_apis;x86_64' --tag google_apis

# Configure AVD.
cat <<EOF > ~/.android/avd/Nexus6.avd/config.ini
avd.ini.encoding=UTF-8
abi.type=x86_64
disk.dataPartition.size=800M
hw.accelerometer=yes
hw.audioInput=yes
hw.battery=yes
hw.camera.back=emulated
hw.camera.front=emulated
hw.cpu.arch=x86_64
hw.cpu.ncore=4
hw.dPad=no
hw.device.hash2=MD5:9b564b60b1aebee32c73ded9daa1e620
hw.device.manufacturer=Google
hw.device.name=Nexus 6
hw.gps=yes
hw.gpu.enabled=yes
hw.gpu.mode=auto
hw.initialOrientation=Portrait
hw.keyboard=yes
hw.lcd.density=560
hw.mainKeys=yes
hw.ramSize=1536
hw.sdCard=yes
hw.sensors.orientation=yes
hw.sensors.proximity=yes
hw.trackBall=no
image.sysdir.1=system-images/android-22/google_apis/x86_64/
runtime.network.latency=none
runtime.network.speed=full
sdcard.size=100M
showDeviceFrame=yes
skin.dynamic=yes
skin.name=nexus_6
skin.path=skins/nexus_6
tag.display=Google APIs
tag.id=google_apis
vm.heapSize=256
EOF
