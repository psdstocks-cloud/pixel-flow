import Link from 'next/link'
import { Card } from '../../../components'

type VerifyPageProps = {
  searchParams: {
    email?: string
  }
}

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  const email = searchParams.email ?? 'your email'
  
  return (
    <section className="auth-card">
      <Card
        title="Check your inbox"
        description="We've sent you a verification email"
      >
        <div className="verification-content">
          <div className="email-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <div className="verification-message">
            <p>
              We sent a verification link to <strong>{email}</strong>
            </p>
            <p>
              Click the link in the email to activate your account. The link will expire in 24 hours.
            </p>
          </div>

          <div className="verification-actions">
            <Link href="/login" className="btn-primary">
              Go to Login
            </Link>
          </div>

          <div className="verification-help">
            <p className="help-text">
              Didn't receive the email?
            </p>
            <ul className="help-list">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>
                <Link href="/signup">Try signing up again</Link> if the problem persists
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <style jsx>{`
        .verification-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 1rem 0;
        }

        .email-icon {
          color: #0070f3;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 112, 243, 0.1);
          border-radius: 50%;
        }

        .verification-message {
          text-align: center;
          max-width: 400px;
        }

        .verification-message p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .verification-message strong {
          color: #0070f3;
          word-break: break-all;
        }

        .verification-actions {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .btn-primary {
          display: inline-block;
          padding: 0.75rem 2rem;
          background: #0070f3;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #0051cc;
        }

        .verification-help {
          width: 100%;
          padding-top: 1.5rem;
          border-top: 1px solid #eaeaea;
        }

        .help-text {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .help-list {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 0.875rem;
          color: #666;
        }

        .help-list li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
        }

        .help-list li:before {
          content: '•';
          position: absolute;
          left: 0.5rem;
          color: #0070f3;
        }

        .help-list a {
          color: #0070f3;
          text-decoration: none;
        }

        .help-list a:hover {
          text-decoration: underline;
        }
      `}</style>
    </section>
  )
}