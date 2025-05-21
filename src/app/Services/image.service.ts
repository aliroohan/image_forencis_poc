import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private baseUrl = 'https://159.65.248.129/api';

  constructor(private http: HttpClient) { }

  analyzeImage(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/analyze_image`, formData, {
      reportProgress: true, 
      observe: 'response'
    });
  }

  detectClone(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/detect_clone`, formData, {
      reportProgress: true, 
      observe: 'response'
    });
  }

  ELA(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/error_level_analysis`, formData, {
      reportProgress: true, 
      observe: 'response'
    });
  }

  noise(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/noise_analysis`, formData, {
      reportProgress: true, 
      observe: 'response'
    });
  }

  metadata(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/extract_exif_metadata`, formData, {
      reportProgress: true, 
      observe: 'response'
    });
  }

    
  
  manipulate(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.baseUrl}/manipulation_likelihood`, formData, {
      reportProgress: true, 
      observe: 'response'
    });
  }
  
}
