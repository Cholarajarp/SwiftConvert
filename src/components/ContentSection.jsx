import React from 'react';

export default function ContentSection({ title, content, subsections }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      {content && <p className="text-gray-600 leading-relaxed mb-4">{content}</p>}
      
      {subsections && subsections.map((subsection, index) => (
        <div key={index} className="mb-6">
          {subsection.subtitle && (
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{subsection.subtitle}</h3>
          )}
          {typeof subsection.text === 'string' ? (
            <p className="text-gray-600 leading-relaxed">{subsection.text}</p>
          ) : (
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              {subsection.text.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
