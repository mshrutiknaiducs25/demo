use login_system;

CREATE TABLE IF NOT EXISTS job_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(150) NOT NULL,
    min_cgpa DECIMAL(3,2) NOT NULL,
    offering_ctc DECIMAL(10,2) NOT NULL,
    location VARCHAR(180) NOT NULL,
    posted_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job_created (created_at),
    CONSTRAINT fk_jobs_posted_by FOREIGN KEY (posted_by) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    user_id INT NOT NULL,
    applicant_cgpa DECIMAL(3,2) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_job_user_application (job_id, user_id),
    INDEX idx_application_job (job_id),
    CONSTRAINT fk_application_job FOREIGN KEY (job_id) REFERENCES job_listings(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_application_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);