type SectionHeaderProps = {
    title: string
    subtitle?: string
    actionSlot?: React.ReactNode
  }
  
  export function SectionHeader({ title, subtitle, actionSlot }: SectionHeaderProps) {
    return (
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>{title}</h1>
          {subtitle ? <p style={{ margin: 0 }}>{subtitle}</p> : null}
        </div>
        {actionSlot}
      </header>
    )
  }
  