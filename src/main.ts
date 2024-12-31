import { bootstrapApplication } from '@angular/platform-browser';
import {
  HttpEventType,
  HttpHandlerFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { tap } from 'rxjs';

function loggingInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  // You can not mutate the request directly, but you can close a new request
  // const req = request.clone({
  //   headers: request.headers.set('X-DEBUG', 'TESTING')
  // });
  console.log('[Outgoing Request]');
  console.log(request);
  // Call next to let the intercepted request continue
  return next(request).pipe(
    // Do not use subscribe here. Otherwise, it is going to be the end of the observable chain and other parts in the application
    // now wouldn't be able to interact with that response anymore.
    tap({
      // get an event type of value instead of the response data
      next: event => {
        if (event.type === HttpEventType.Response) {
          console.log('[Incoming Response]');
          console.log(event.status);
          console.log(event.body);
        }
      }
    })
  );
}

/**
 * Modern Angular apps typically use standalone components, not NgModules. But many Angular projects DO still use this "older approach".
 * 
 * Therefore, it's important to understand how you can provide Angular's HttpClient when working with NgModules.
 * 
 * Instead of of providing the http client via provideHttpClient() passed to bootstrapApplication(), you pass it to the providers array
 * of your root NgModule
 */

bootstrapApplication(AppComponent, {
    // Have a HTTP client provider registered application wide
    providers: [provideHttpClient(withInterceptors([loggingInterceptor]))]
  }).catch((err) => console.error(err));


/** 
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

@NgModule({
declarations: [
    AppComponent,
    PlacesComponent,
    // ... etc
],
imports: [BrowserModule, FormsModule],
providers: [provideHttpClient()],
bootstrap: [AppComponent],
})
export class AppModule {}
*/
