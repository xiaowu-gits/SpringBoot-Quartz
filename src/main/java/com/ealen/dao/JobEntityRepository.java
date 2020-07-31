package com.ealen.dao;

import com.ealen.entity.JobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Created by EalenXie on 2018/6/4 14:27
 */
@Repository
public interface JobEntityRepository extends JpaRepository<JobEntity, Long> {

    JobEntity getById(Long id);

    @Query(value="SELECT * FROM job_entity WHERE name=?1 AND job_group =?2",nativeQuery=true)
    JobEntity findByNameAndGroup(String name,String jobGroup);

    /** 查出所有的触发器 */
    @Query(value="SELECT * FROM QRTZ_TRIGGERS ORDER BY START_TIME",nativeQuery=true)
    List<Object> findTrigger();

    /** 通过名称查找触发器 */
    @Query(value="SELECT * FROM QRTZ_TRIGGERS WHERE TRIGGER_NAME LIKE '%?1%' ORDER BY START_TIME",nativeQuery=true)
    List<Object> findTriggerByName(final String triggerName);

    /** 通过名称和分组查找触发器 */
    @Query(value="SELECT * FROM QRTZ_TRIGGERS WHERE TRIGGER_NAME LIKE '%?1%' AND TRIGGER_GROUP = ?2 ORDER BY START_TIME",nativeQuery=true)
    List<Object> findTrigger(final String triggerName, final String group);

    /** 通过分组查找触发器 */
    @Query(value="SELECT * FROM QRTZ_TRIGGERS WHERE	TRIGGER_GROUP =?1 ORDER BY START_TIME",nativeQuery=true)
    List<Object> findTriggerByGroup(final String group);


    /** 通过名称和分组查找Cron类型触发器 */
    @Query(value="SELECT CRON_EXPRESSION FROM QRTZ_CRON_TRIGGERS WHERE TRIGGER_NAME=?1 AND TRIGGER_GROUP =?2",nativeQuery=true)
    String findCron(final String name,final String group);

    @Query(value = "select * from QRTZ_TRIGGERS where 1=1 " +
            "and  " +
            "IF(?1 = '' , 1=1 , TRIGGER_NAME = ?1) " +
            "and  " +
            "IF(?2 = '' , 1=1 , TRIGGER_GROUP = ?2) " +
            "order by START_TIME", nativeQuery = true)
    List<Object> getTriggerByParams(String name, String group);

}
