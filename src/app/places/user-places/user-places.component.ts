import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';

import { PlacesContainerComponent } from '../places-container/places-container.component';
import { PlacesComponent } from '../places.component';
import { Place } from '../place.model';

import { PlacesService } from '../places.service';

@Component({
  selector: 'app-user-places',
  standalone: true,
  templateUrl: './user-places.component.html',
  styleUrl: './user-places.component.css',
  imports: [PlacesContainerComponent, PlacesComponent],
})
export class UserPlacesComponent implements OnInit {
  // places = signal<Place[] | undefined>(undefined);
  isFetching = signal(false);
  error = signal('');
  private destroyRef = inject(DestroyRef);

  private placesService = inject(PlacesService);
  places = this.placesService.loadedUserPlaces;

  ngOnInit() {
    this.isFetching.set(true);
    const subscription = 
      // this.httpClient
      // .get<{ places: Place[] }>('http://localhost:3000/user-places')
      // .pipe(
      //   map((resData) => resData.places),
      //   catchError((error) => {
      //     console.log(error);
      //     return throwError(
      //       () =>
      //         new Error(
      //           'Something went wrong fetching your favorite places. Please try again later.'
      //         )
      //     );
      //   })
      // )
      this.placesService.loadUserPlaces()
      .subscribe({
        //// places now is loadedUserPlaces, which is readonly, can not be set
        // next: (places) => {
        //   this.places.set(places);
        // },
        error: (error: Error) => {
          this.error.set(error.message);
        },
        complete: () => {
          this.isFetching.set(false);
        },
      });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  onRemovePlace(place: Place) {
    // If no subscribe, no observable emitting events 
    const subscription = this.placesService.removeUserPlace(place).subscribe();

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}