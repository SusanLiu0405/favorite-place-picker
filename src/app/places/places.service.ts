import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, throwError } from 'rxjs';

import { Place } from './place.model';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  // one service is using another service
  private errorService = inject(ErrorService);
  private httpClient = inject(HttpClient);
  // Using signals for cross component communication (available-places.component.ts and user-places.component.ts)
  // This signal is shared by two components. If one component changes the signal, the other component will update 
  // accordingly.
  // An alternative way is to use subject.
  private userPlaces = signal<Place[]>([]);

  // This is used by user-places.component.ts, this component can only read, can not update
  loadedUserPlaces = this.userPlaces.asReadonly();

  // wrapper function of fetchPlaces
  loadAvailablePlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/places',
      'Something went wrong fetching the available places. Please try again later.'
    );
  }

  // wrapper function of fetchPlaces
  loadUserPlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/user-places',
      'Something went wrong fetching your favorite places. Please try again later.'
    ).pipe(
      // Use the tap operator to update update the data without subscribing to the observable
      tap({
        next: (userPlaces) => this.userPlaces.set(userPlaces),
      })
    );
  }

  addPlaceToUserPlaces(place: Place) {
    // This will add duplicated places, not good
    // this.userPlaces.update(prevPlaces => [...prevPlaces, place]);

    const prevPlaces = this.userPlaces();

    // This is optmistic updating, meaning: we update before the api call
    // If api call fails, then data is out of sync between frontend and backend
    if (!prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set([...prevPlaces, place]);
    }

    return this.httpClient
      .put('http://localhost:3000/user-places', {
        placeId: place.id,
      })
      .pipe(
        catchError((error) => {
          // Rollback the userPlaces to the prevPlaces if any issue happens
          // What if frontend shows a pic and then API fails, will the pic disapear
          // after a sec?
          this.userPlaces.set(prevPlaces);
          this.errorService.showError('Failed to save selected place');
          return throwError(() => new Error('Failed to store selected place.'));
        })
      );
  }

  removeUserPlace(place: Place) {
    const prevPlaces = this.userPlaces();

    if (prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set(prevPlaces.filter((p) => p.id !== place.id));
    }

    return this.httpClient
      .delete('http://localhost:3000/user-places/' + place.id)
      .pipe(
        catchError((error) => {
          this.userPlaces.set(prevPlaces);
          this.errorService.showError('Failed to remove the selected place.');
          return throwError(
            () => new Error('Failed to remove the selected place.')
          );
        })
      );
  }

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient.get<{ places: Place[] }>(url).pipe(
      map((resData) => resData.places),
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}