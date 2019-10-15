import { Injectable } from '@angular/core';
declare var io;

@Injectable()
export class SocketService{
    public io;
    constructor(){
        this.io = io('/');
    }
}