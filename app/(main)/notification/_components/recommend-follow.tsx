import React from 'react'
import Image from 'next/image'

const RecommendFollow = () => {
  return (
    <div>
      <section aria-labelledby="recommend-heading" className="mt-10">
        <h2 id="recommend-heading" className="mb-3 text-sm text-gray-700 text-center">
          フォローのおすすめ
        </h2>
        <ul className="space-y-4">
          {[
            {
              id: '1',
              name: 'Koki',
              subtitle: '20代、エニタイム新宿店、ダイエット目的',
              user_icon: '/images/image.png',
            },
            {
              id: '2',
              name: 'Takuma',
              subtitle: '30代、エニタイム浅草店、筋肥大目的',
              user_icon: '/images/image.png',
            },
          ].map((user) => (
            <li key={user.id} className="flex items-center gap-3">
              <Image
                src={user.user_icon}
                alt="user icon"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="truncate text-xs text-gray-500">{user.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default RecommendFollow
