import { Component } from "@angular/core";
import Swal from 'sweetalert2';
import { DataManagerService } from '../data.service';
import { SocketService } from '../socket.service';

@Component({
    selector: 'page-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss']
})
export class HomeComponent{
    Toast: typeof Swal;
    dragging: boolean = false;
    sounds: Sound[] = [];
    playing: Sound;
    progress: number = 0;
    volume: number = 1;
    me: any;

    constructor(private dataMngr: DataManagerService, private socket: SocketService) {
        this.Toast = Swal.mixin({
            toast: true,
            position: 'center',
            showConfirmButton: false,
            timer: 3000,
        });
        this.loadSounds();
        
        this.socket.io.on('connect', function() {
            // console.log(this.socket.io);
            // this.me = this.socket.io.sessionid; 
        });

        this.socket.io.on('sounds-update', (data) => {
            this.loadSounds();
        });

        this.socket.io.on('playing-update', (data:any) => {
            this.progress = data.at;
            if(!this.playing || this.playing.id !== data.playing) {
                this.getPlaying(data.playing);
            }
        });

        this.socket.io.on('volume', (data) => {
            console.log(this.socket.io);
            this.me = this.socket.io.id;
            if(data.id !== this.me){
                this.volume = data.volume;
            }
        })

        this.socket.io.on('playing-end', () => {
            this.playing = null;
            this.progress = 0;
            this.sounds = this.sounds.sort((a,b)=>{return a.played < b.played ? 1 : a.played > b.played ? -1 : 0});
        })
    }

    onPlay(id) {
        this.socket.io.emit('play', {id});
    }

    onDelete(id) {
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${this.sounds.filter(sound => sound.id == id)[0].name}`,
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            console.log(result)
            if (result.value) {
                this.dataMngr.post('delete_sound', {id}).then(()=>{
                    Swal.fire(
                        'Deleted!',
                        'Your file has been deleted.',
                        'success'
                    );
                })
            }
          })
    }

    loadSounds() {
        this.dataMngr.post('get_sounds', {}).then((data: Sound[]) => {
            this.sounds = data.sort((a,b)=>{return a.played < b.played ? 1 : a.played > b.played ? -1 : 0});
        });
    }
    
    getPlaying(id) {
        this.playing = this.sounds.filter(sound => sound.id == id)[0];
        this.playing.played ++;
    }

    onDragend(e:DragEvent) {
        this.dragging = false;
    }

    onDragover(e:DragEvent) {
        e.preventDefault();
        this.dragging = true;
    }

    onDrop(e:DragEvent) {
        e.preventDefault();
        this.dragging = false;
        console.log(e);
        let dt = e.dataTransfer;
        let files = dt.files;
        if(files.length < 2) {
            let file = files[0];
            if((['audio/x-wav', 'audio/mpeg']).indexOf(file.type) >= 0) {
                let formdata = new FormData();
                formdata.append('sound', file);

                Swal.fire({
                    title: 'Name this file',
                    input: 'text',
                    inputAttributes: {
                      autocapitalize: 'off'
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Upload',
                    showLoaderOnConfirm: true,
                    preConfirm: (name) => {
                        formdata.append('name', name);
                        return this.dataMngr.filePost('save_sound', formdata).then((data:any)=>{
                            if(data.ok) {
                                return data;
                            } else if(data.error) {
                                Swal.showValidationMessage(
                                    `Request failed: ${data.error}`
                                )
                            }
                        });
                    },
                    allowOutsideClick: () => !Swal.isLoading()
                  }).then((data:any)=>{
                      if(data.ok) this.Toast.fire({type: 'success', title: 'Upload complete'});
                  });
            } else {
                // alert incorrect file
                this.Toast.fire({
                    type: 'error',
                    title: 'Unsuported file type'
                })
            }
        } else {
            // one file at a time
            this.Toast.fire({
                type: 'error',
                title: 'One file at a time'
            })
        }
    }

    onVolume() {
        console.log(this.volume)
        this.socket.io.emit('volume-set', {volume: this.volume});
    }
}

interface Sound {
    id: string;
    name: string,
    played: number;
    path: string;
    img: string;
}