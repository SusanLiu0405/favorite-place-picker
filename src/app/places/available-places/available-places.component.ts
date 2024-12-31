import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';

import { Place } from '../place.model';
import { PlacesComponent } from '../places.component';
import { PlacesContainerComponent } from '../places-container/places-container.component';
import { PlacesService } from '../places.service';


@Component({
  selector: 'app-available-places',
  /**
   * Without standalone: true: Components are typically declared in an Angular module (using declarations). 
   * You cannot use a component unless it's declared in a module.
   * 
   * With standalone: true: The component can be used directly without being part of a module's declarations array. 
   * It allows Angular to treat the component as a standalone entity, including its own dependencies via the imports array, 
   * (PlacesComponent and PlacesContainerComponent are imported directly into this component).
   */
  // What is standalone component?
  standalone: true,
  templateUrl: './available-places.component.html',
  styleUrl: './available-places.component.css',
  imports: [PlacesComponent, PlacesContainerComponent],
})
export class AvailablePlacesComponent implements OnInit {
  places = signal<Place[] | undefined>(undefined);
  isFetching = signal(false);
  error = signal('');
  // Two ways: 
  // 1. old way, use traditional constructor-based dependency injection
  // 2. new way, use the new inject() function introduced in Angular 14
  private httpClient = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private placesService = inject(PlacesService);

  // constructor(private httpClient: HttpClient) {}

  ngOnInit() {
    this.isFetching.set(true);
    // httpClient.get return an observable
    // If there is no subscriber to the observable, then the api call will not happen
    
    // You can pass a second argument, which is a configuration object 
    // { observe: 'response' }, returns the whole response object. Use response.body?.places 
    // { observe: 'events' }, returns different events that occur during that request response lifecycle
    const subscription = 
      // this.httpClient
      // .get<{ places: Place[] }>('http://localhost:3000/places')
      // .pipe(
      //   // operators can make the observer leaner
      //   // map is an operator
      //   map((resData) => resData.places),
      //   // catch and transform error
      //   catchError((error) => {
      //     console.log(error);
      //     // Generates a new observable which will automatically throw an error
      //     return throwError(
      //       () => new Error('Something went wrong fetching the available places. Please try again later.')
      //     );
      //   })
      // )
      this.placesService.loadAvailablePlaces()
      // Have the subscribe here instead of the PlacesService, because 
      // 1. we would like to do subscription.unsubscribe(); in the component, when the component got removed
      // 2. each UI has its own UI updating logic 
      .subscribe({ // define an observer object
        next: (places) => {
          this.places.set(places);
        },
        error: (error: Error) => {
          this.error.set(error.message);
        },
        // API call is finished, then complete is triggered, set isFetching to false
        complete: () => {
          this.isFetching.set(false);
        }
      });

    // A good practice to unsubscribe  
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  onSelectPlace(selectedPlace: Place) {    
    const subscription = 
      // this.httpClient
      // // in put function, second param is an object, which is attached as JSON data to this outgoing put request
      // // you have to use .subscribe to trigger the put request
      // .put('http://localhost:3000/user-places', {
      //   placeId: selectedPlace.id,
      // })

      this.placesService.addPlaceToUserPlaces(selectedPlace)
      // HTTP requests in Angular are "cold observables" - they don't execute until something subscribes to them.
      // Alternative to subscribe, use firstValueFrom() with async/await:
      .subscribe({
        next: (resData) => console.log(resData),
      });

    // A good practice to unsubscribe  
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
