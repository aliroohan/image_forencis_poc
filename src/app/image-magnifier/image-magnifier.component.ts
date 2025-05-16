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
      const { left, top, width, height } = this.imgRef.nativeElement.getBoundingClientRect();
      
      // Calculate mouse position relative to the image
      const x = e.clientX - left;
      const y = e.clientY - top;
      
      // Set magnifier position
      this.position = { x, y };
      
      // Calculate cursor position as percentage
      this.cursorPosition = {
        x: (x / width) * 100,
        y: (y / height) * 100,
      };
      
      this.showMagnifier = true;
    }
  }
  
  @HostListener('mouseleave')
  handleMouseLeave() {
    this.showMagnifier = false;
  }
}
