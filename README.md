# how to run linux/amd64 on mac os m1


Execute:
   ```shell 
   softwareupdate --install-rosetta
   colima start --profile rosetta --cpu 2 --memory 4 --disk 40 --arch aarch64 --vm-type=vz --vz-rosetta --mount-type virtiofs
   ```
   ```
