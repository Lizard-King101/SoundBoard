import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';

@Injectable()
export class DataManagerService {
    public uploadedPercentage: number;

    constructor(private http: HttpClient) {

    }

    public post(command, data) {
        const headers:HttpHeaders = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3000/'
        });
        return new Promise((resolve, reject) => {
            this.http.post( '/' + command, JSON.stringify(data), { headers }).toPromise().then((response: any) => {
                // clearTimeout(timeout);
                if (response) {
                    resolve(response);
                } else {
                    resolve(false);
                }
            }).catch((error) => {
                // if (triggerError) this.serverError();
            });
        });
    }

    public async filePost(command: string, data: FormData) {
        return new Promise((res, rej) => {
            // data.append('command', command);
            this.http.post('/' + command, data, {
                reportProgress: true,
                observe: 'events',
                responseType: 'text',
                headers:  new HttpHeaders({processData: 'false'}),
            }).subscribe((event: HttpEvent<any>) => {
                switch (event.type) {
                    case HttpEventType.Sent:
                        // start
                        // load.present();
                        break;
                    case HttpEventType.Response:
                        // complete
                        // load.dismiss();
                        this.uploadedPercentage = 0;
                        res(event.body);
                        break;
                    case 1: {
                        if (Math.round(this.uploadedPercentage) !== Math.round(event['loaded'] / event['total'] * 100)) {
                            this.uploadedPercentage = event['loaded'] / event['total'] * 100;
                            // this.event.publish('loader', this.uploadedPercentage);
                        }
                        break;
                    }
                }
            });
        })
    }

    public get(path, options = false) {
        return new Promise((res, rej) => {
            this.http.get(path, {responseType: 'blob'}).subscribe((file) => {
                res(file);
            });
        });
    }
}