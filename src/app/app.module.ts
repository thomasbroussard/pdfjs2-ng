import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { CropFromPdfComponent } from './components/crop-from-pdf/crop-from-pdf.component';


@NgModule({
  declarations: [
    AppComponent,
    CropFromPdfComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
