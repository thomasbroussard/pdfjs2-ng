import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CropFromPdfComponent } from './crop-from-pdf.component';

describe('CropFromPdfComponent', () => {
  let component: CropFromPdfComponent;
  let fixture: ComponentFixture<CropFromPdfComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CropFromPdfComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CropFromPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
