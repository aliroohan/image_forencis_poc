import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ImageService } from '../Services/image.service';
import { ImageMagnifierComponent } from '../image-magnifier/image-magnifier.component';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LucideAngularModule, Search } from 'lucide-angular';

interface ImageMetadata {
  name: string;
  width: number;
  height: number;
  format: string;
  size: number;
  colorSpace?: string;
  exif?: Record<string, any>;
  [key: string]: any;
}

interface AnalysisResult {
  overallAssessment: string;
  summary: string;
  manipulationProbability: number;
  cloneDetection: string;
  exifAnalysis: string;
  indicatorsFound: number;
}

interface AnalyzeResponse {
  manipulation_probability: number;
  analysis_text: string;
  exif_data: Record<string, any>;
  clone_count: number;
  original_image: string;
  ela_image: string;
  noise_image: string;
  heatmap_image: string;
  clone_image: string;
}

interface CloneResponse {
  detection: string;
  imageUrl: string;
}

interface ELAResponse {
  imageUrl: string;
}

interface NoiseResponse {
  imageUrl: string;
}

interface MetadataResponse {
  width: number;
  height: number;
  colorSpace: string;
  exif: Record<string, any>;
  analysis: string;
}

interface ManipulateResponse {
  assessment: string;
  summary: string;
  probability: number;
}

@Component({
  selector: 'app-image-visualizer',
  standalone: true,
  imports: [CommonModule, ImageMagnifierComponent, FormsModule, LucideAngularModule],
  templateUrl: './image-visualizer.component.html',
  styleUrls: ['./image-visualizer.component.scss', './image-visualizer1.scss']
})
export class ImageVisualizerComponent implements OnInit {
  originalImage: string | null = null;
  processedImage: string | null = null;
  isLoading = false;
  metadata: ImageMetadata | null = null;
  showMetadata = false;
  zoomLevel = 2.5;
  activeTab: string = 'original';
  
  analysisResult: AnalysisResult = {
    overallAssessment: '',
    summary: '',
    manipulationProbability: 0,
    cloneDetection: '',
    exifAnalysis: '',
    indicatorsFound: 0
  };
  
  elaImage: string | null = null;
  noiseImage: string | null = null;
  cloneImage: string | null = null;
  aiHeatmapImage: string | null = null;
  currentFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  processingSteps = [
    { id: 1, text: 'Analyzing image metadata', completed: false, active: false },
    { id: 2, text: 'Performing Error Level Analysis', completed: false, active: false },
    { id: 3, text: 'Detecting image manipulation', completed: false, active: false },
    { id: 4, text: 'Generating analysis report', completed: false, active: false }
  ];
  currentStep = 0;

  constructor(private imageService: ImageService, private router: Router) { }

  ngOnInit(): void {
    if (!localStorage.getItem('user')) {
      this.router.navigate(['/login']);
    }
   }

  signOut(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
    console.log('Signing out...');
   
  }

  private isValidBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

  private ensureBase64Prefix(base64String: string): string {
    if (!base64String) return '';
    
    // If it's already a data URL, return as is
    if (base64String.startsWith('data:')) {
      return base64String;
    }
    
    // If it's a pure base64 string, add the prefix
    if (this.isValidBase64(base64String)) {
      return `data:image/jpeg;base64,${base64String}`;
    }
    
    return base64String;
  }

  handleFileUpload(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please upload an image file', 'error');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('File size should be less than 10MB', 'error');
      return;
    }

    this.activeTab = 'original';
    this.isLoading = true;
    this.currentFile = file;
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64String = reader.result as string;
      this.originalImage = this.ensureBase64Prefix(base64String);
      this.fetchMetadata(file);
      this.isLoading = false;
    };

    reader.onerror = () => {
      this.showToast('Error reading file', 'error');
      this.isLoading = false;
    };
    
    reader.readAsDataURL(file);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFileUpload({ target: { files: event.dataTransfer.files } });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  async analyzeImage(): Promise<void> {
    if (!this.currentFile) {
      this.showToast('Please upload an image first', 'error');
      return;
    }

    this.isLoading = true;
    this.resetProcessingSteps();
    this.startProcessingAnimation();

    try {
      // Call analysis endpoint
      this.resetProcessingSteps();
    
      const analyzeResult = await firstValueFrom(this.imageService.analyzeImage(this.currentFile) as Observable<AnalyzeResponse>);

      // Parse the analysis text to extract different sections
      const analysisText = analyzeResult.analysis_text;
      const overallAssessmentMatch = analysisText.match(/\*\*Overall Assessment: (.*?)\*\*/);
      const cloneDetectionMatch = analysisText.match(/### Clone Detection Analysis:\n(.*?)(?=\n\n|$)/s);
      const exifAnalysisMatch = analysisText.match(/### EXIF Metadata Analysis:\n(.*?)(?=\n\n|$)/s);
      const indicatorsMatch = analysisText.match(/Indicators found: (\d+)/);

      // Update analysis results
      this.analysisResult = {
        overallAssessment: overallAssessmentMatch ? overallAssessmentMatch[1] : 'No assessment available',
        summary: analysisText.split('\n\n')[1] || 'No summary available',
        manipulationProbability: analyzeResult.manipulation_probability || 0,
        cloneDetection: cloneDetectionMatch ? cloneDetectionMatch[1].trim() : 'No clone detection results',
        exifAnalysis: exifAnalysisMatch ? exifAnalysisMatch[1].trim() : 'No EXIF analysis available',
        indicatorsFound: indicatorsMatch ? parseInt(indicatorsMatch[1]) : 0
      };
      this.startProcessingAnimation();
      
      // Update images with proper base64 handling
      this.elaImage = this.ensureBase64Prefix(analyzeResult.ela_image || '');
      this.noiseImage = this.ensureBase64Prefix(analyzeResult.noise_image || '');
      this.cloneImage = this.ensureBase64Prefix(analyzeResult.clone_image || '');
      this.aiHeatmapImage = this.ensureBase64Prefix(analyzeResult.heatmap_image || '');

      this.showToast('Analysis complete', 'success');
    } catch (error) {
      console.error('Error during analysis:', error);
      this.showToast('Error during analysis. Please try again.', 'error');
    } finally {
      this.isLoading = false;
      this.completeProcessingSteps();
    }
  }

  private resetProcessingSteps(): void {
    this.processingSteps.forEach(step => {
      step.completed = false;
      step.active = false;
    });
    this.currentStep = 0;
  }

  private startProcessingAnimation(): void {
    this.processingSteps[0].active = true;
    
    // Simulate step progression
    const stepInterval = setInterval(() => {
      if (this.currentStep < this.processingSteps.length) {
        if (this.currentStep > 0) {
          this.processingSteps[this.currentStep - 1].completed = true;
          this.processingSteps[this.currentStep - 1].active = false;
        }
        if (this.currentStep < this.processingSteps.length) {
          this.processingSteps[this.currentStep].active = true;
        }
        this.currentStep++;
      } else {
        clearInterval(stepInterval);
      }
    }, 1000); // Change step every 2 seconds
  }

  private completeProcessingSteps(): void {
    this.processingSteps.forEach(step => {
      step.completed = true;
      step.active = false;
    });
  }

  fetchMetadata(file: File): void {
    (this.imageService.metadata(file) as Observable<MetadataResponse>).pipe(
      catchError(error => {
        console.error('Error fetching metadata:', error);
        this.showToast('Error fetching metadata', 'error');
        throw error;
      })
    ).subscribe({
      next: (result: MetadataResponse) => {
        this.metadata = {
          width: result.width || 0,
          height: result.height || 0,
          format: file.type.split('/')[1].toUpperCase(),
          size: file.size,
          lastModified: new Date(file.lastModified).toLocaleString(),
          name: file.name,
          colorSpace: result.colorSpace || "Unknown",
          exif: result.exif || {}
        };
      },
      error: (error) => {
        console.error('Error in metadata subscription:', error);
        this.showToast('Error processing metadata', 'error');
      }
    });
  }

  increaseZoom(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 0.5, 10);
  }

  decreaseZoom(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 0.5, 1);
  }

  private showToast(message: string, type: 'success' | 'error' | 'info'): void {
    console.log(`${type}: ${message}`);
    // Here you would call your toast service
  }
}
