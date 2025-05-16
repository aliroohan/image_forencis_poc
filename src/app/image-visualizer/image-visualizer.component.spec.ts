import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageVisualizerComponent } from './image-visualizer.component';

describe('ImageVisualizerComponent', () => {
  let component: ImageVisualizerComponent;
  let fixture: ComponentFixture<ImageVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageVisualizerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
