// image-magnifier.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-image-magnifier',
  imports: [CommonModule],
  templateUrl: './image-magnifier.component.html',
  styleUrls: ['./image-magnifier.component.scss']
})
export class ImageMagnifierComponent implements AfterViewInit {
  @Input() src!: string;
  @Input() width: string = '100%';
  @Input() zoomLevel: number = 2.5;
  
  @ViewChild('imgRef') imgRef!: ElementRef;
  
  position = { x: 0, y: 0 };
  showMagnifier = false;
  cursorPosition = { x: 0, y: 0 };
  
  constructor() {}
  
  ngAfterViewInit() {}
  
  handleMouseMove(e: MouseEvent) {
    if (this.imgRef && this.imgRef.nativeElement) {
      // Get image position and dimensions
      const rect = this.imgRef.nativeElement.getBoundingClientRect();
      
      // Calculate mouse position relative to the image
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate cursor position as percentage of image dimensions
      this.cursorPosition = {
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100
      };
      
      // Ensure the magnifier stays within image bounds
      const magnifierSize = 150; // Size of the magnifier
      const halfSize = magnifierSize / 2;
      
      // Calculate the magnifier position
      const magnifierX = Math.max(halfSize, Math.min(rect.width - halfSize, x));
      const magnifierY = Math.max(halfSize, Math.min(rect.height - halfSize, y));
      
      // Set the magnifier position
      this.position = {
        x: magnifierX,
        y: magnifierY
      };
      
      this.showMagnifier = true;
    }
  }
  
  @HostListener('mouseleave')
  handleMouseLeave() {
    this.showMagnifier = false;
  }
}
