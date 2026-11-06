import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BentoDescription } from './bento-description';

@Component({
  imports: [BentoDescription],
  template: `<app-bento-description>Bonjour <mark>Angular</mark></app-bento-description>`,
})
class Host {}

describe('BentoDescription', () => {
  it('projects its content, including highlights', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const description = fixture.nativeElement.querySelector('.description');
    expect(description.textContent).toContain('Bonjour');
    expect(description.querySelector('mark').textContent).toBe('Angular');
  });
});
